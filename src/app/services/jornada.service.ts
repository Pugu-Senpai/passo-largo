import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Jornada } from '../models/jornada.model';
import { Marco } from '../models/marco.model';
import { EstadoJornada } from '../models/tipos';
import { REGRAS } from '../models/regras';
import { hoje } from '../utils/datas';

interface LinhaJornada {
  id: number;
  aventureiro_id: number;
  estado: EstadoJornada;
  km_percorridos: number;
  ultimo_marco_id: number | null;
  numero_recuos: number;
  data_ultimo_recuo: string | null;
  data_inicio: string;
  data_fim: string | null;
}

const COLUNAS =
  'id, aventureiro_id, estado, km_percorridos, ultimo_marco_id, numero_recuos, data_ultimo_recuo, data_inicio, data_fim';

const VIOLACAO_UNICIDADE = '23505';

@Injectable({ providedIn: 'root' })
export class JornadaService {
  private readonly supabase = inject(SupabaseService);

  private readonly lista = signal<Jornada[]>([]);
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
      .from('jornadas')
      .select(COLUNAS)
      .eq('aventureiro_id', aventureiroId)
      .order('id')
      .returns<LinhaJornada[]>();

    if (error) {
      console.error('Erro ao carregar jornadas:', error.message);
      return;
    }

    this.lista.set((data ?? []).map(paraJornada));
    this.aventureiroCarregado = aventureiroId;
  }

  // ===== Leitura =====

  obterAtiva(utilizadorId: number): Jornada | undefined {
    return this.lista().find(j => j.utilizadorId === utilizadorId && j.estado === 'ativa');
  }

  obterUltima(utilizadorId: number): Jornada | undefined {
    return this.lista()
      .filter(j => j.utilizadorId === utilizadorId)
      .sort((a, b) => b.id - a.id)[0];
  }

  // ===== Escrita =====

  async obterOuCriar(utilizadorId: number): Promise<Jornada> {
    await this.garantirCarregado(utilizadorId);
    if (this.aventureiroCarregado !== utilizadorId) {
      throw new Error('Não foi possível carregar a jornada. Tenta novamente.');
    }

    const ativa = this.obterAtiva(utilizadorId);
    if (ativa) {
      return ativa;
    }

    const { data, error } = await this.supabase.cliente
      .from('jornadas')
      .insert({ aventureiro_id: utilizadorId })
      .select(COLUNAS)
      .returns<LinhaJornada[]>()
      .single();

    if (error?.code === VIOLACAO_UNICIDADE) {
      this.aventureiroCarregado = null;
      await this.garantirCarregado(utilizadorId);
      const existente = this.obterAtiva(utilizadorId);
      if (existente) {
        return existente;
      }
    }

    if (error || !data) {
      console.error('Erro ao criar jornada:', error?.message);
      throw new Error('Não foi possível começar a jornada. Tenta novamente.');
    }

    const nova = paraJornada(data);
    this.lista.update(lista => [...lista, nova]);
    return nova;
  }

  // ===== Regras da jornada =====

  async adicionarKm(jornada: Jornada, km: number, marcos: Marco[]): Promise<Jornada> {
    const kmNovos = Math.min(jornada.kmPercorridos + km, REGRAS.distanciaTotalKm);
    const marco = this.marcoAtual(kmNovos, marcos);
    const alcancouNovoMarco = !!marco && marco.id !== jornada.ultimoMarcoId;

    return this.guardar({
      ...jornada,
      kmPercorridos: this.arredondar(kmNovos),
      ultimoMarcoId: marco?.id ?? jornada.ultimoMarcoId,
      numeroRecuos: alcancouNovoMarco ? 0 : jornada.numeroRecuos,
      estado: kmNovos >= REGRAS.distanciaTotalKm ? 'concluida' : jornada.estado,
      dataFim: kmNovos >= REGRAS.distanciaTotalKm ? hoje() : jornada.dataFim,
    });
  }

  async recuar(jornada: Jornada, marcos: Marco[]): Promise<Jornada> {
    const valorRecuo = REGRAS.recuoInicialKm + REGRAS.recuoIncrementoKm * jornada.numeroRecuos;
    const checkpoint = marcos.find(m => m.id === jornada.ultimoMarcoId);
    const kmMinimo = checkpoint?.km ?? 0;

    return this.guardar({
      ...jornada,
      kmPercorridos: this.arredondar(Math.max(jornada.kmPercorridos - valorRecuo, kmMinimo)),
      numeroRecuos: jornada.numeroRecuos + 1,
      dataUltimoRecuo: hoje(),
    });
  }

  async marcarComoFalhada(jornada: Jornada): Promise<Jornada> {
    return this.guardar({ ...jornada, estado: 'falhada', dataFim: hoje() });
  }

  // ===== Cálculos para a interface =====

  marcoAtual(km: number, marcos: Marco[]): Marco | undefined {
    return this.ordenar(marcos).filter(m => m.km <= km).pop();
  }

  proximoMarco(km: number, marcos: Marco[]): Marco | undefined {
    return this.ordenar(marcos).find(m => m.km > km);
  }

  progresso(km: number): number {
    return km / REGRAS.distanciaTotalKm;
  }

  // ===== Limpeza =====

  apagarDoUtilizador(utilizadorId: number): void {
    this.lista.update(lista => lista.filter(j => j.utilizadorId !== utilizadorId));
    if (this.aventureiroCarregado === utilizadorId) {
      this.aventureiroCarregado = null;
    }
  }

  // ===== Auxiliares privados =====

  private async guardar(jornada: Jornada): Promise<Jornada> {
    const { data, error } = await this.supabase.cliente
      .from('jornadas')
      .update(paraLinhaAtualizacao(jornada))
      .eq('id', jornada.id)
      .eq('aventureiro_id', jornada.utilizadorId)
      .select(COLUNAS)
      .returns<LinhaJornada[]>()
      .single();

    if (error || !data) {
      console.error('Erro ao guardar jornada:', error?.message);
      throw new Error('Não foi possível guardar o progresso da jornada. Tenta novamente.');
    }

    const guardada = paraJornada(data);
    this.lista.update(lista => lista.map(j => (j.id === guardada.id ? guardada : j)));
    return guardada;
  }

  private limparMemoria(): void {
    this.lista.set([]);
    this.aventureiroCarregado = null;
  }

  private ordenar(marcos: Marco[]): Marco[] {
    return [...marcos].sort((a, b) => a.km - b.km);
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 10) / 10;
  }
}

function paraJornada(linha: LinhaJornada): Jornada {
  return {
    id: linha.id,
    utilizadorId: linha.aventureiro_id,
    estado: linha.estado,
    kmPercorridos: Number(linha.km_percorridos),
    ultimoMarcoId: linha.ultimo_marco_id,
    numeroRecuos: linha.numero_recuos,
    dataUltimoRecuo: linha.data_ultimo_recuo,
    dataInicio: linha.data_inicio,
    dataFim: linha.data_fim ?? undefined,
  };
}

function paraLinhaAtualizacao(jornada: Jornada) {
  return {
    estado: jornada.estado,
    km_percorridos: jornada.kmPercorridos,
    ultimo_marco_id: jornada.ultimoMarcoId,
    numero_recuos: jornada.numeroRecuos,
    data_ultimo_recuo: jornada.dataUltimoRecuo,
    data_fim: jornada.dataFim ?? null,
  };
}