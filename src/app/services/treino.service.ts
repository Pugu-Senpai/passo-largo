import { Injectable } from '@angular/core';
import { Exercicio } from '../models/exercicio.model';
import { Utilizador } from '../models/utilizador.model';
import { NivelFisico, Zona, Intensidade, TipoTreino, Duracao } from '../models/tipos';
import { REGRAS } from '../models/regras';

export interface ConfigTreino {
  tipo: TipoTreino;
  duracao: Duracao;
  foco: Zona;
  intensidade: Intensidade;
}

@Injectable({ providedIn: 'root' })
export class TreinoService {

  private readonly FOCO_POR_NIVEL: Record<NivelFisico, Zona[]> = {
    'sedentario': ['full-body'],
    'pouco-ativo': ['full-body'],
    'ativo': ['full-body', 'upper', 'lower'],
    'muito-ativo': ['upper', 'lower']
  };

  private readonly INTENSIDADE_POR_NIVEL: Record<NivelFisico, Intensidade[]> = {
    'sedentario': ['leve'],
    'pouco-ativo': ['leve', 'moderado'],
    'ativo': ['moderado'],
    'muito-ativo': ['moderado', 'vigoroso']
  };

  opcoesFoco(nivel: NivelFisico): Zona[] {
    return this.FOCO_POR_NIVEL[nivel];
  }

  opcoesIntensidade(nivel: NivelFisico): Intensidade[] {
    return this.INTENSIDADE_POR_NIVEL[nivel];
  }

  objetivo(duracao: Duracao): number {
    return REGRAS.objetivoExercicios[duracao];
  }

  // ===== Sorteio =====

  sortear(exercicios: Exercicio[], utilizador: Utilizador, config: ConfigTreino): Exercicio[] {
    const disponiveis = exercicios.filter(e =>
      e.niveis.includes(utilizador.nivelFisico) &&
      (e.equipamento === 'nenhum' || utilizador.temKettlebell)
    );

    const forca = disponiveis.filter(e =>
      e.tipo === 'forca' &&
      (config.foco === 'full-body' || e.zona === config.foco || e.zona === 'full-body')
    );

    const cardio = disponiveis.filter(e =>
      e.tipo === 'cardio' && e.intensidade === config.intensidade
    );

    switch (config.tipo) {
      case 'forca':
        return this.baralhar(forca);
      case 'cardio':
        return this.baralhar(cardio);
      case 'misto':
        return this.intercalar(this.baralhar(forca), this.baralhar(cardio));
    }
  }

  // ===== Distância =====

  calcularKm(minutos: number, feitos: number, objetivo: number): number {
    const taxaMin = REGRAS.taxaMin;
    const taxaMax = REGRAS.taxaMax;
    const taxa = taxaMin + (taxaMax - taxaMin) * Math.min(feitos / objetivo, 1);
    const distancia = minutos * taxa;
    return Math.round(distancia * 10)/10;
  }

  // ===== Auxiliares =====

  private baralhar<T>(lista: T[]): T[] {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  private intercalar<T>(a: T[], b: T[]): T[] {
    const resultado: T[] = [];
    const maior = Math.max(a.length, b.length);
    for (let i = 0; i < maior; i++) {
      if (a[i]) resultado.push(a[i]);
      if (b[i]) resultado.push(b[i]);
    }
    return resultado;
  }
}