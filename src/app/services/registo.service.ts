import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RegistoDia } from '../models/registo-dia.model';
import { EstadoDia, TipoTreino } from '../models/tipos';
import { Utilizador } from '../models/utilizador.model';
import { REGRAS } from '../models/regras';
import { Jornada } from '../models/jornada.model';
import { hoje, inicioSemana, somarDias, diferencaDias } from '../utils/datas';

export type NovoTreino = Omit<RegistoDia, 'id' | 'data' | 'estado'>;
type NovoRegisto = Omit<RegistoDia, 'id'>;

export interface ResumoAtividade {
  treinos: number;
  minutos: number;
  km: number;
  descansos: number;
  falhas: number;
}

interface LinhaRegisto {
  id: number;
  aventureiro_id: number;
  jornada_id: number;
  data: string;
  estado: EstadoDia;
  tipo_treino: TipoTreino | null;
  minutos_ativos: number;
  exercicios_feitos: number;
  km_ganhos: number;
  km_reais: number | null;
}

const COLUNAS =
  'id, aventureiro_id, jornada_id, data, estado, tipo_treino, minutos_ativos, exercicios_feitos, km_ganhos, km_reais';

const CHAVE_UNICA = 'aventureiro_id,data';

@Injectable({ providedIn: 'root' })
export class RegistoService {
  private readonly supabase = inject(SupabaseService);

  private readonly lista = signal<RegistoDia[]>([]);
  private aventureiroCarregado: number | null = null;
  private pedidoEmCurso: Promise<void> | null = null;

  constructor() {
    this.supabase.cliente.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        this.limparMemoria();
      }
    });
  }

  // ===== Carregamento =====

  async garantirCarregado(aventureiroId: number): Promise<void> {
    if (this.aventureiroCarregado === aventureiroId) {
      return;
    }
    this.pedidoEmCurso ??= this.carregar(aventureiroId).finally(() => (this.pedidoEmCurso = null));
    return this.pedidoEmCurso;
  }

  private async carregar(aventureiroId: number): Promise<void> {
    this.limparMemoria();

    const { data, error } = await this.supabase.cliente
      .from('registos')
      .select(COLUNAS)
      .eq('aventureiro_id', aventureiroId)
      .order('data')
      .returns<LinhaRegisto[]>();

    if (error) {
      console.error('Erro ao carregar registos:', error.message);
      return;
    }

    this.lista.set((data ?? []).map(paraRegisto));
    this.aventureiroCarregado = aventureiroId;
  }

  // ===== Consultas =====

  obterDoUtilizador(utilizadorId: number): RegistoDia[] {
    return this.lista()
      .filter(r => r.utilizadorId === utilizadorId)
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  obterDia(utilizadorId: number, data: string): RegistoDia | undefined {
    return this.lista().find(r => r.utilizadorId === utilizadorId && r.data === data);
  }

  descansosNaSemana(utilizadorId: number, data: string): number {
    return this.contarDescansos(this.obterDoUtilizador(utilizadorId), data);
  }

  podeDescansar(utilizador: Utilizador, data: string = hoje()): boolean {
    return this.descansosNaSemana(utilizador.id, data) < utilizador.diasDescansoSemana;
  }

  resumo(utilizadorId: number): ResumoAtividade {
    const registos = this.obterDoUtilizador(utilizadorId);
    return {
      treinos: registos.filter(r => r.minutosAtivos > 0).length,
      minutos: registos.reduce((total, r) => total + r.minutosAtivos, 0),
      km: Math.round(registos.reduce((total, r) => total + r.kmGanhos, 0) * 10) / 10,
      descansos: registos.filter(r => r.estado === 'descanso').length,
      falhas: registos.filter(r => r.estado === 'falha').length
    };
  }

  treinosDaJornada(jornadaId: number): number {
    return this.registosDaJornada(jornadaId).filter(r => r.minutosAtivos > 0).length;
  }

  descansosRestantes(utilizador: Utilizador, data: string = hoje()): number {
    return Math.max(utilizador.diasDescansoSemana - this.descansosNaSemana(utilizador.id, data), 0);
  }

  // ===== Registar o dia de hoje =====

  private async exigirCarregado(aventureiroId: number): Promise<void> {
    await this.garantirCarregado(aventureiroId);
    if (this.aventureiroCarregado !== aventureiroId) {
      throw new Error('Não foi possível carregar os registos. Tenta novamente.');
    }
  }

  async registarTreino(dados: NovoTreino): Promise<RegistoDia> {
    await this.exigirCarregado(dados.utilizadorId);
    const data = hoje();
    const existente = this.obterDia(dados.utilizadorId, data);
    const jaTreinou = !!existente && existente.minutosAtivos > 0;
    const minutosAtivos = (jaTreinou ? existente.minutosAtivos : 0) + dados.minutosAtivos;
    const kmGanhos = (jaTreinou ? existente.kmGanhos : 0) + dados.kmGanhos;
    const exerciciosFeitos = (jaTreinou ? existente.exerciciosFeitos : 0) + dados.exerciciosFeitos;

    const [guardado] = await this.guardar([{
      ...dados,
      data,
      estado: this.estadoPorMinutos(minutosAtivos),
      minutosAtivos,
      kmGanhos: Math.round(kmGanhos * 10) / 10,
      exerciciosFeitos
    }]);
    return guardado;
  }

  async registarDescanso(utilizador: Utilizador, jornadaId: number): Promise<boolean> {
    await this.exigirCarregado(utilizador.id);
    const data = hoje();
    const existente = this.obterDia(utilizador.id, data);

    if (existente && (existente.estado === 'completo' || existente.estado === 'descanso')) {
      return false;
    }
    if (!this.podeDescansar(utilizador, data)) {
      return false;
    }

    await this.guardar([
      existente
        ? { ...existente, estado: 'descanso' }
        : this.criarRegistoVazio(utilizador.id, jornadaId, data, 'descanso')
    ]);
    return true;
  }

  // ===== Cálculos da jornada =====

  async preencherDiasEmFalta(utilizador: Utilizador, jornada: Jornada): Promise<number> {
    await this.exigirCarregado(utilizador.id);
    const registos = this.registosDaJornada(jornada.id);
    const ultimo = registos[registos.length - 1];
    const ontem = somarDias(hoje(), -1);
    let data = ultimo ? somarDias(ultimo.data, 1) : jornada.dataInicio;

    const existentes = this.obterDoUtilizador(utilizador.id);
    const novos: NovoRegisto[] = [];

    while (data <= ontem) {
      const descansos = this.contarDescansos([...existentes, ...novos], data);
      const estado: EstadoDia = descansos < utilizador.diasDescansoSemana ? 'descanso' : 'falha';
      novos.push(this.criarRegistoVazio(utilizador.id, jornada.id, data, estado));
      data = somarDias(data, 1);
    }

    if (novos.length > 0) {
      await this.guardar(novos, true);
    }
    return novos.length;
  }

  streak(jornadaId: number): number {
    const porData = new Map(this.registosDaJornada(jornadaId).map(r => [r.data, r]));
    let data = hoje();

    const deHoje = porData.get(data);
    if (!deHoje || deHoje.estado === 'falha') {
      data = somarDias(data, -1);
    }

    let contagem = 0;
    let registo = porData.get(data);
    while (registo && registo.estado !== 'falha') {
      contagem++;
      data = somarDias(data, -1);
      registo = porData.get(data);
    }
    return contagem;
  }

  falhasAtivas(jornada: Jornada): number {
    return this.listaFalhasAtivas(jornada).length;
  }

  ultimaFalhaAtiva(jornada: Jornada): string | undefined {
    const falhas = this.listaFalhasAtivas(jornada);
    return falhas[falhas.length - 1]?.data;
  }

  private listaFalhasAtivas(jornada: Jornada): RegistoDia[] {
    const dataHoje = hoje();
    return this.registosDaJornada(jornada.id).filter(r =>
      r.estado === 'falha' &&
      r.data < dataHoje &&
      diferencaDias(r.data, dataHoje) <= REGRAS.diasValidadeFalha &&
      (!jornada.dataUltimoRecuo || r.data >= jornada.dataUltimoRecuo)
    );
  }

  diasSeguidosSemTreinar(jornadaId: number): number {
    const porData = new Map(this.registosDaJornada(jornadaId).map(r => [r.data, r]));
    let data = somarDias(hoje(), -1);
    let contagem = 0;
    let registo = porData.get(data);

    while (registo && registo.minutosAtivos === 0) {
      contagem++;
      data = somarDias(data, -1);
      registo = porData.get(data);
    }
    return contagem;
  }

  // ===== Limpeza =====

  apagarDoUtilizador(utilizadorId: number): void {
    this.lista.update(lista => lista.filter(r => r.utilizadorId !== utilizadorId));
    if (this.aventureiroCarregado === utilizadorId) {
      this.aventureiroCarregado = null;
    }
  }

  // ===== Auxiliares privados =====

  private criarRegistoVazio(utilizadorId: number, jornadaId: number, data: string, estado: EstadoDia): NovoRegisto {
    return {
      utilizadorId,
      jornadaId,
      data,
      estado,
      minutosAtivos: 0,
      exerciciosFeitos: 0,
      kmGanhos: 0
    };
  }

  private async guardar(registos: NovoRegisto[], soNovos = false): Promise<RegistoDia[]> {
    const { data, error } = await this.supabase.cliente
      .from('registos')
      .upsert(registos.map(paraLinha), { onConflict: CHAVE_UNICA, ignoreDuplicates: soNovos })
      .select(COLUNAS)
      .returns<LinhaRegisto[]>();

    if (error || !data || (!soNovos && data.length !== registos.length)) {
      console.error('Erro ao guardar registo:', error?.message ?? 'resposta incompleta');
      throw new Error('Não foi possível guardar o registo do dia. Tenta novamente.');
    }

    const guardados = data.map(paraRegisto);
    this.lista.update(lista => [
      ...lista.filter(r => !guardados.some(g => g.utilizadorId === r.utilizadorId && g.data === r.data)),
      ...guardados
    ]);
    return guardados;
  }

  private registosDaJornada(jornadaId: number): RegistoDia[] {
    return this.lista()
      .filter(r => r.jornadaId === jornadaId)
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  private contarDescansos(registos: { data: string; estado: EstadoDia }[], data: string): number {
    const segunda = inicioSemana(data);
    const domingo = somarDias(segunda, 6);
    return registos.filter(r => r.estado === 'descanso' && r.data >= segunda && r.data <= domingo).length;
  }

  private estadoPorMinutos(minutos: number): EstadoDia {
    return minutos >= REGRAS.minutosCompleto ? 'completo' : 'falha';
  }

  private limparMemoria(): void {
    this.lista.set([]);
    this.aventureiroCarregado = null;
  }
}

function paraRegisto(linha: LinhaRegisto): RegistoDia {
  return {
    id: linha.id,
    utilizadorId: linha.aventureiro_id,
    jornadaId: linha.jornada_id,
    data: linha.data,
    estado: linha.estado,
    tipoTreino: linha.tipo_treino ?? undefined,
    minutosAtivos: linha.minutos_ativos,
    exerciciosFeitos: linha.exercicios_feitos,
    kmGanhos: Number(linha.km_ganhos),
    kmReais: linha.km_reais === null ? undefined : Number(linha.km_reais),
  };
}

function paraLinha(registo: NovoRegisto) {
  return {
    aventureiro_id: registo.utilizadorId,
    jornada_id: registo.jornadaId,
    data: registo.data,
    estado: registo.estado,
    tipo_treino: registo.tipoTreino ?? null,
    minutos_ativos: registo.minutosAtivos,
    exercicios_feitos: registo.exerciciosFeitos,
    km_ganhos: registo.kmGanhos,
    km_reais: registo.kmReais ?? null,
  };
}