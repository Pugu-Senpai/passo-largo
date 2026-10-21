import { Injectable } from '@angular/core';
import { ArmazenamentoService } from './armazenamento.service';
import { Jornada } from '../models/jornada.model';
import { Marco } from '../models/marco.model';
import { REGRAS } from '../models/regras';
import { hoje } from '../utils/datas';

@Injectable({ providedIn: 'root' })
export class JornadaService {
  private readonly CHAVE = 'pl_jornadas';

  constructor(private armazenamento: ArmazenamentoService) { }

  // ===== Leitura e criação =====

  obterAtiva(utilizadorId: number): Jornada | undefined {
    return this.obterTodas().find(j => j.utilizadorId === utilizadorId && j.estado === 'ativa');
  }

  obterOuCriar(utilizadorId: number): Jornada {
    const ativa = this.obterAtiva(utilizadorId);
    if (ativa) {
      return ativa;
    }

    const nova: Jornada = {
      id: this.armazenamento.proximoId(this.obterTodas()),
      utilizadorId,
      estado: 'ativa',
      kmPercorridos: 0,
      ultimoMarcoId: null,
      numeroRecuos: 0,
      dataUltimoRecuo: null,
      dataInicio: hoje(),
    };
    this.guardarJornada(nova);
    return nova;
  }

  obterUltima(utilizadorId: number): Jornada | undefined {
    return this.obterTodas()
      .filter(j => j.utilizadorId === utilizadorId)
      .sort((a, b) => b.id - a.id)[0];
  }

  // ===== Regras da jornada =====

  adicionarKm(jornada: Jornada, km: number, marcos: Marco[]): Jornada {
    const kmNovos = Math.min(jornada.kmPercorridos + km, REGRAS.distanciaTotalKm);
    const marco = this.marcoAtual(kmNovos, marcos);
    const alcancouNovoMarco = !!marco && marco.id !== jornada.ultimoMarcoId;

    const atualizada: Jornada = {
      ...jornada,
      kmPercorridos: this.arredondar(kmNovos),
      ultimoMarcoId: marco?.id ?? jornada.ultimoMarcoId,
      numeroRecuos: alcancouNovoMarco ? 0 : jornada.numeroRecuos,
      estado: kmNovos >= REGRAS.distanciaTotalKm ? 'concluida' : jornada.estado,
      dataFim: kmNovos >= REGRAS.distanciaTotalKm ? hoje() : jornada.dataFim,
    };
    this.guardarJornada(atualizada);
    return atualizada;
  }

  recuar(jornada: Jornada, marcos: Marco[]): Jornada {
    const valorRecuo = REGRAS.recuoInicialKm + REGRAS.recuoIncrementoKm * jornada.numeroRecuos;
    const checkpoint = marcos.find(m => m.id === jornada.ultimoMarcoId);
    const kmMinimo = checkpoint?.km ?? 0;

    const atualizada: Jornada = {
      ...jornada,
      kmPercorridos: this.arredondar(Math.max(jornada.kmPercorridos - valorRecuo, kmMinimo)),
      numeroRecuos: jornada.numeroRecuos + 1,
      dataUltimoRecuo: hoje(),
    };
    this.guardarJornada(atualizada);
    return atualizada;
  }

  marcarComoFalhada(jornada: Jornada): Jornada {
    const atualizada: Jornada = { ...jornada, estado: 'falhada' };
    this.guardarJornada(atualizada);
    return atualizada;
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
    const restantes = this.obterTodas().filter(j => j.utilizadorId !== utilizadorId);
    this.armazenamento.guardar(this.CHAVE, restantes);
  }

  // ===== Auxiliares privados =====

  private obterTodas(): Jornada[] {
    return this.armazenamento.ler<Jornada[]>(this.CHAVE, []);
  }

  private guardarJornada(jornada: Jornada): void {
    const todas = this.obterTodas();
    const existe = todas.some(j => j.id === jornada.id);
    const lista = existe
      ? todas.map(j => j.id === jornada.id ? jornada : j)
      : [...todas, jornada];
    this.armazenamento.guardar(this.CHAVE, lista);
  }

  private ordenar(marcos: Marco[]): Marco[] {
    return [...marcos].sort((a, b) => a.km - b.km);
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 10) / 10;
  }
}