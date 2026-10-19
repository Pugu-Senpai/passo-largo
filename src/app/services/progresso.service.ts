import { Injectable } from '@angular/core';
import { JornadaService } from './jornada.service';
import { RegistoService } from './registo.service';
import { Utilizador } from '../models/utilizador.model';
import { Jornada } from '../models/jornada.model';
import { Marco } from '../models/marco.model';
import { REGRAS } from '../models/regras';

export interface ResultadoDiario {
  jornada: Jornada;
  derrota: boolean;
  houveRecuo: boolean;
  kmRecuados: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressoService {

  constructor(
    private jornadaService: JornadaService,
    private registoService: RegistoService
  ) {}

  aplicarRegrasDiarias(utilizador: Utilizador, jornada: Jornada, marcos: Marco[]): ResultadoDiario {
    this.registoService.preencherDiasEmFalta(utilizador, jornada);

    if (this.registoService.diasSeguidosSemTreinar(jornada.id) >= REGRAS.diasSeguidosParaDerrota) {
      this.jornadaService.marcarComoFalhada(jornada);
      const nova = this.jornadaService.obterOuCriar(utilizador.id);
      return { jornada: nova, derrota: true, houveRecuo: false, kmRecuados: 0 };
    }

    if (this.registoService.falhasAtivas(jornada) >= REGRAS.falhasParaRecuo) {
      const kmAntes = jornada.kmPercorridos;
      const atualizada = this.jornadaService.recuar(jornada, marcos);
      const kmRecuados = Math.round((kmAntes - atualizada.kmPercorridos) * 10) / 10;
      return { jornada: atualizada, derrota: false, houveRecuo: true, kmRecuados };
    }

    return { jornada, derrota: false, houveRecuo: false, kmRecuados: 0 };
  }
}