import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { JornadaService } from '../../services/jornada.service';
import { DadosService } from '../../services/dados.service';
import { UtilizadorService } from '../../services/utilizador.service';
import { RegistoService } from '../../services/registo.service';
import { ProgressoService } from '../../services/progresso.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { Marco } from '../../models/marco.model';
import { firstValueFrom } from 'rxjs';
import { RegistoDia } from '../../models/registo-dia.model';
import { hoje, diferencaDias } from '../../utils/datas';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { MapaPercurso } from '../../components/mapa-percurso/mapa-percurso';

@Component({
  selector: 'app-condado',
  imports: [RouterLink, DecimalPipe, PercentPipe, DatePipe, CabecalhoApp, MapaPercurso],
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
  concluida = false;
  treinosJornada = 0;
  descansosRestantes = 0;
  aCriar = false;
  erroNovaJornada = '';
  aAcampar = false;
  erroDescanso = '';

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private dadosService: DadosService,
    private registoService: RegistoService,
    private progressoService: ProgressoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.erro = false;
    this.cdr.markForCheck();

    try {
      const ultima = this.jornadaService.obterUltima(this.utilizador!.id);
      if (ultima?.estado === 'concluida') {
        this.jornada = ultima;
        this.concluida = true;
        this.treinosJornada = this.registoService.treinosDaJornada(ultima.id);
      } else {
        this.jornada = await this.jornadaService.obterOuCriar(this.utilizador!.id);
      }

      const marcos = await firstValueFrom(this.dadosService.obterMarcos());
      if (marcos.length === 0) {
        throw new Error('Sem marcos');
      }
      this.marcos = marcos;

      if (!this.concluida) {
        const resultado = await this.progressoService.aplicarRegrasDiarias(this.utilizador!, this.jornada, marcos);
        this.jornada = resultado.jornada;
        this.derrota = resultado.derrota;
        this.houveRecuo = resultado.houveRecuo;
        this.kmRecuados = resultado.kmRecuados;
      }

      this.atualizarResumo();
    } catch (e) {
      console.error('Erro ao preparar o Condado:', (e as Error).message);
      this.erro = true;
    } finally {
      this.carregando = false;
      this.cdr.markForCheck();
    }
  }

  async acampar(): Promise<void> {
    if (this.aAcampar) {
      return;
    }
    this.aAcampar = true;
    this.mensagemDescanso = '';
    this.erroDescanso = '';

    try {
      const aceite = await this.registoService.registarDescanso(this.utilizador!, this.jornada!.id);
      this.mensagemDescanso = aceite
        ? 'Montaste acampamento. Recupera forças para amanhã.'
        : 'Já usaste os dias de descanso desta semana.';
      this.atualizarResumo();
    } catch (e) {
      this.erroDescanso = (e as Error).message;
    } finally {
      this.aAcampar = false;
      this.cdr.markForCheck();
    }
  }

  private atualizarResumo(): void {
    const km = this.jornada!.kmPercorridos;
    this.marcoAtual = this.jornadaService.marcoAtual(km, this.marcos);
    this.proximoMarco = this.jornadaService.proximoMarco(km, this.marcos);
    this.streak = this.registoService.streak(this.jornada!.id);
    this.registoHoje = this.registoService.obterDia(this.utilizador!.id, hoje());
    this.descansosRestantes = this.registoService.descansosRestantes(this.utilizador!);
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

  get diasDeJornada(): number {
    if (!this.jornada) {
      return 0;
    }
    return diferencaDias(this.jornada.dataInicio, this.jornada.dataFim ?? hoje()) + 1;
  }

  get podeAcampar(): boolean {
    const estado = this.registoHoje?.estado;
    return !estado || estado === 'falha';
  }

  async novaJornada(): Promise<void> {
    if (this.aCriar) {
      return;
    }
    this.aCriar = true;
    this.erroNovaJornada = '';

    try {
      this.jornada = await this.jornadaService.obterOuCriar(this.utilizador!.id);
      this.concluida = false;
      this.atualizarResumo();
    } catch (e) {
      this.erroNovaJornada = (e as Error).message;
    } finally {
      this.aCriar = false;
      this.cdr.markForCheck();
    }
  }
}