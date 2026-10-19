import { Injectable } from '@angular/core';
import { ArmazenamentoService } from './armazenamento.service';
import { RegistoDia } from '../models/registo-dia.model';
import { EstadoDia } from '../models/tipos';
import { Utilizador } from '../models/utilizador.model';
import { REGRAS } from '../models/regras';
import { Jornada } from '../models/jornada.model';
import { hoje, inicioSemana, somarDias, diferencaDias } from '../utils/datas';

export type NovoTreino = Omit<RegistoDia, 'id' | 'data' | 'estado'>;

@Injectable({ providedIn: 'root' })
export class RegistoService {
  private readonly CHAVE = 'pl_registos';

  constructor(private armazenamento: ArmazenamentoService) {}

  // ===== Consultas =====

  obterDoUtilizador(utilizadorId: number): RegistoDia[] {
    return this.obterTodos()
      .filter(r => r.utilizadorId === utilizadorId)
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  obterDia(utilizadorId: number, data: string): RegistoDia | undefined {
    return this.obterTodos().find(r => r.utilizadorId === utilizadorId && r.data === data);
  }

  descansosNaSemana(utilizadorId: number, data: string): number {
    const segunda = inicioSemana(data);
    const domingo = somarDias(segunda, 6);
    return this.obterDoUtilizador(utilizadorId)
      .filter(r => r.estado === 'descanso' && r.data >= segunda && r.data <= domingo)
      .length;
  }

  podeDescansar(utilizador: Utilizador, data: string = hoje()): boolean {
    return this.descansosNaSemana(utilizador.id, data) < utilizador.diasDescansoSemana;
  }

  // ===== Registar o dia de hoje =====

  registarTreino(dados: NovoTreino): RegistoDia {
    const data = hoje();
    const existente = this.obterDia(dados.utilizadorId, data);
    const jaTreinou = !!existente && existente.minutosAtivos > 0;

    // Se já treinou hoje, soma ao que já tinha; senão, começa do zero
    const minutosAtivos = (jaTreinou ? existente.minutosAtivos : 0) + dados.minutosAtivos;
    const kmGanhos = (jaTreinou ? existente.kmGanhos : 0) + dados.kmGanhos;
    const exerciciosFeitos = (jaTreinou ? existente.exerciciosFeitos : 0) + dados.exerciciosFeitos;

    const registo: RegistoDia = {
      ...dados,
      id: existente?.id ?? this.armazenamento.proximoId(this.obterTodos()),
      data,
      estado: this.estadoPorMinutos(minutosAtivos),
      minutosAtivos,
      kmGanhos: Math.round(kmGanhos * 10) / 10,
      exerciciosFeitos
    };
    this.guardarRegisto(registo);
    return registo;
  }

  registarDescanso(utilizador: Utilizador, jornadaId: number): boolean {
    const data = hoje();
    const existente = this.obterDia(utilizador.id, data);

    if (existente || !this.podeDescansar(utilizador, data)) {
      return false;
    }

    this.guardarRegisto(this.criarRegistoVazio(utilizador.id, jornadaId, data, 'descanso'));
    return true;
  }

    // ===== Cálculos da jornada =====

  preencherDiasEmFalta(utilizador: Utilizador, jornada: Jornada): number {
    const registos = this.registosDaJornada(jornada.id);
    const ultimo = registos[registos.length - 1];
    const ontem = somarDias(hoje(), -1);
    let data = ultimo ? somarDias(ultimo.data, 1) : jornada.dataInicio;
    let preenchidos = 0;

    while (data <= ontem) {
      const estado: EstadoDia = this.podeDescansar(utilizador, data) ? 'descanso' : 'falha';
      this.guardarRegisto(this.criarRegistoVazio(utilizador.id, jornada.id, data, estado));
      data = somarDias(data, 1);
      preenchidos++;
    }
    return preenchidos;
  }

  streak(jornadaId: number): number {
    const porData = new Map(this.registosDaJornada(jornadaId).map(r => [r.data, r]));
    let data = hoje();

    // Se hoje ainda não há treino válido, não quebra: a pessoa ainda pode treinar
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
    const dataHoje = hoje();
    return this.registosDaJornada(jornada.id).filter(r =>
      r.estado === 'falha' &&
      r.data < dataHoje &&
      diferencaDias(r.data, dataHoje) <= REGRAS.diasValidadeFalha &&
      (!jornada.dataUltimoRecuo || r.data >= jornada.dataUltimoRecuo)
    ).length;
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

  private registosDaJornada(jornadaId: number): RegistoDia[] {
    return this.obterTodos()
      .filter(r => r.jornadaId === jornadaId)
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  // ===== Limpeza =====

  apagarDoUtilizador(utilizadorId: number): void {
    const restantes = this.obterTodos().filter(r => r.utilizadorId !== utilizadorId);
    this.armazenamento.guardar(this.CHAVE, restantes);
  }

  // ===== Auxiliares =====

  criarRegistoVazio(utilizadorId: number, jornadaId: number, data: string, estado: EstadoDia): RegistoDia {
    return {
      id: this.armazenamento.proximoId(this.obterTodos()),
      utilizadorId,
      jornadaId,
      data,
      estado,
      minutosAtivos: 0,
      exerciciosFeitos: 0,
      objetivoExercicios: 0,
      kmGanhos: 0
    };
  }

  guardarRegisto(registo: RegistoDia): void {
    const todos = this.obterTodos();
    const existe = todos.some(r => r.id === registo.id);
    const lista = existe
      ? todos.map(r => r.id === registo.id ? registo : r)
      : [...todos, registo];
    this.armazenamento.guardar(this.CHAVE, lista);
  }

  private estadoPorMinutos(minutos: number): EstadoDia {
    if (minutos >= REGRAS.minutosCompleto) return 'completo';
    if (minutos >= REGRAS.minutosSuave) return 'suave';
    return 'falha';
  }

  private obterTodos(): RegistoDia[] {
    return this.armazenamento.ler<RegistoDia[]>(this.CHAVE, []);
  }
}

