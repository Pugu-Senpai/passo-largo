import { Component, Input } from '@angular/core';
import { Marco } from '../../models/marco.model';
import { REGRAS } from '../../models/regras';
import { PERCURSO, pontoNoPercurso } from '../../utils/percurso';

interface MarcoNoMapa {
  marco: Marco;
  x: number;
  y: number;
  alcancado: boolean;
}

@Component({
  selector: 'app-mapa-percurso',
  imports: [],
  templateUrl: './mapa-percurso.html',
  styleUrl: './mapa-percurso.css'
})
export class MapaPercurso {
  @Input({ required: true }) marcos: Marco[] = [];
  @Input() km = 0;

  readonly percurso = PERCURSO;

  get progresso(): number {
    return Math.min(this.km / REGRAS.distanciaTotalKm, 1);
  }

  get fracaoMapa(): number {
    return this.converterKmParaMapa(this.km);
  }

  get marcosNoMapa(): MarcoNoMapa[] {
    return this.marcos.map(marco => {
      const ponto = pontoNoPercurso(marco.posicao);
      return { marco, x: ponto.x, y: ponto.y, alcancado: marco.km <= this.km };
    });
  }

  get viajante(): { x: number; y: number } {
    return pontoNoPercurso(this.fracaoMapa);
  }

  private converterKmParaMapa(km: number): number {
    const ordenados = [...this.marcos].sort((a, b) => a.km - b.km);
    if (ordenados.length === 0) {
      return 0;
    }
    if (km <= ordenados[0].km) {
      return ordenados[0].posicao;
    }

    for (let i = 0; i < ordenados.length - 1; i++) {
      const anterior = ordenados[i];
      const seguinte = ordenados[i + 1];
      if (km <= seguinte.km) {
        const fracaoDoTroco = (km - anterior.km) / (seguinte.km - anterior.km);
        return anterior.posicao + (seguinte.posicao - anterior.posicao) * fracaoDoTroco;
      }
    }

    return ordenados[ordenados.length - 1].posicao;
  }
}