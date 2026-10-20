import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { JornadaService } from '../../services/jornada.service';
import { DadosService } from '../../services/dados.service';
import { UtilizadorService } from '../../services/utilizador.service';
import { RegistoService } from '../../services/registo.service';
import { ProgressoService } from '../../services/progresso.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { Marco } from '../../models/marco.model';
import { RegistoDia } from '../../models/registo-dia.model';
import { hoje } from '../../utils/datas';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';

@Component({
  selector: 'app-condado',
  imports: [RouterLink, DecimalPipe, PercentPipe, CabecalhoApp],
  templateUrl: './condado.html',
  styleUrl: './condado.css'
})
export class Condado implements OnInit {
  utilizador?: Utilizador;
  jornada?: Jornada;
  marcos: Marco[] = [];
  marcoAtual?: Marco;
  proximoMarco?: Marco;
  registoHoje?: RegistoDia;
  streak = 0;

  carregando = true;
  erro = false;

  derrota = false;
  houveRecuo = false;
  kmRecuados = 0;
  mensagemDescanso = '';

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private dadosService: DadosService,
    private registoService: RegistoService,
    private progressoService: ProgressoService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
        if (!Array.isArray(marcos) || marcos.length === 0) {
          this.erro = true;
          this.carregando = false;
          this.cdr.markForCheck();
          return;
        }
        this.marcos = marcos;

        const resultado = this.progressoService.aplicarRegrasDiarias(this.utilizador!, this.jornada!, marcos);
        this.jornada = resultado.jornada;
        this.derrota = resultado.derrota;
        this.houveRecuo = resultado.houveRecuo;
        this.kmRecuados = resultado.kmRecuados;

        this.atualizarResumo();
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = true;
        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  acampar(): void {
    const aceite = this.registoService.registarDescanso(this.utilizador!, this.jornada!.id);
    this.mensagemDescanso = aceite
      ? 'Montaste acampamento. Recupera forças para amanhã.'
      : 'Já usaste os dias de descanso desta semana.';
    this.atualizarResumo();
  }

  private atualizarResumo(): void {
    const km = this.jornada!.kmPercorridos;
    this.marcoAtual = this.jornadaService.marcoAtual(km, this.marcos);
    this.proximoMarco = this.jornadaService.proximoMarco(km, this.marcos);
    this.streak = this.registoService.streak(this.jornada!.id);
    this.registoHoje = this.registoService.obterDia(this.utilizador!.id, hoje());
  }

  get progresso(): number {
    return this.jornada ? this.jornadaService.progresso(this.jornada.kmPercorridos) : 0;
  }

  get kmEmFalta(): number {
    if (!this.jornada || !this.proximoMarco) {
      return 0;
    }
    return this.proximoMarco.km - this.jornada.kmPercorridos;
  }
}