import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { JornadaService } from '../../services/jornada.service';
import { DadosService } from '../../services/dados.service';
import { UtilizadorService } from '../../services/utilizador.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { Marco } from '../../models/marco.model';

@Component({
  imports: [],
  selector: 'app-condado',
  styleUrl: './condado.css',
  templateUrl: './condado.html',
})
export class Condado implements OnInit {
  utilizador?: Utilizador;
  jornada?: Jornada;
  marcos: Marco[] = [];
  marcoAtual?: Marco;
  proximoMarco?: Marco;
  carregando = true;
  erro = false;

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private dadosService: DadosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.jornada = this.jornadaService.obterOuCriar(this.utilizador.id);
    this.carregarMarcos();
  }

  carregarMarcos(): void {
    this.carregando = true;
    this.erro = false;

    this.dadosService.obterMarcos().subscribe({
      next: (marcos) => {
        this.marcos = marcos;
        const km = this.jornada!.kmPercorridos;
        this.marcoAtual = this.jornadaService.marcoAtual(km, marcos);
        this.proximoMarco = this.jornadaService.proximoMarco(km, marcos);
        this.carregando = false;
      },
      error: () => {
        this.erro = true;
        this.carregando = false;
      }
    });
  }
}

