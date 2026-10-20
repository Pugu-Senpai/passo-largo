import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CartaoExercicio } from '../../components/cartao-exercicio/cartao-exercicio';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilizadorService } from '../../services/utilizador.service';
import { JornadaService } from '../../services/jornada.service';
import { DadosService } from '../../services/dados.service';
import { TreinoService } from '../../services/treino.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada as JornadaModelo } from '../../models/jornada.model';
import { Exercicio } from '../../models/exercicio.model';
import { TipoTreino, Duracao, Zona, Intensidade } from '../../models/tipos';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RegistoService } from '../../services/registo.service';
import { Marco } from '../../models/marco.model';
import { EstadoDia } from '../../models/tipos';
import { REGRAS } from '../../models/regras';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';

type Fase = 'escolha' | 'sessao' | 'fim';

@Component({
  selector: 'app-jornada',
  imports: [RouterLink, FormsModule, CartaoExercicio, DecimalPipe, CabecalhoApp],
  templateUrl: './jornada.html',
  styleUrl: './jornada.css'
})
export class Jornada implements OnInit, OnDestroy {
  fase: Fase = 'escolha';

  utilizador?: Utilizador;
  jornada?: JornadaModelo;
  exercicios: Exercicio[] = [];
  sessao: Exercicio[] = [];
  marcos: Marco[] = [];
  kmReais: number | null = null;
  guardado = false;

  carregando = true;
  erro = false;
  semExercicios = false;
  indice = 0;
  feitos = 0;
  segundosRestantes = 0;
  pausado = false;
  minutosAtivos = 0;

  private timerId?: ReturnType<typeof setInterval>;

  // Escolhas do utilizador (ligadas com [(ngModel)])
  tipo: TipoTreino = 'forca';
  duracao: Duracao = 30;
  foco: Zona = 'full-body';
  intensidade: Intensidade = 'leve';

  opcoesFoco: Zona[] = [];
  opcoesIntensidade: Intensidade[] = [];

  // Textos a mostrar para cada valor
  readonly rotuloFoco: Record<Zona, string> = {
    'full-body': 'Corpo inteiro',
    'upper': 'Parte superior',
    'lower': 'Parte inferior'
  };

  readonly rotuloIntensidade: Record<Intensidade, string> = {
    'leve': 'Leve',
    'moderado': 'Moderado',
    'vigoroso': 'Vigoroso'
  };

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private dadosService: DadosService,
    private treinoService: TreinoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private registoService: RegistoService,
  ) {}

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.jornada = this.jornadaService.obterOuCriar(this.utilizador.id);

    this.opcoesFoco = this.treinoService.opcoesFoco(this.utilizador.nivelFisico);
    this.opcoesIntensidade = this.treinoService.opcoesIntensidade(this.utilizador.nivelFisico);
    this.foco = this.opcoesFoco[0];
    this.intensidade = this.opcoesIntensidade[0];

    this.carregarExercicios();
  }

  carregarExercicios(): void {
    this.carregando = true;
    this.erro = false;

    forkJoin({
      exercicios: this.dadosService.obterExercicios(),
      marcos: this.dadosService.obterMarcos()
    }).subscribe({
      next: ({ exercicios, marcos }) => {
        if (!Array.isArray(exercicios) || exercicios.length === 0 || !Array.isArray(marcos)) {
          this.erro = true;
        } else {
          this.exercicios = exercicios;
          this.marcos = marcos;
        }
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

  get objetivo(): number {
    return this.treinoService.objetivo(this.duracao);
  }

  comecar(): void {
    this.sessao = this.treinoService.sortear(this.exercicios, this.utilizador!, {
      tipo: this.tipo,
      duracao: this.duracao,
      foco: this.foco,
      intensidade: this.intensidade
    });

    this.semExercicios = this.sessao.length === 0;
    if (this.semExercicios) {
      return;
    }

    this.indice = 0;
    this.feitos = 0;
    this.segundosRestantes = this.duracao * 60;
    this.pausado = false;
    this.fase = 'sessao';
    this.iniciarTimer();
  }

    // ===== Sessão =====

  get exercicioAtual(): Exercicio {
    return this.sessao[this.indice % this.sessao.length];
  }

  get tempoFormatado(): string {
    const minutos = Math.floor(this.segundosRestantes / 60);
    const segundos = this.segundosRestantes % 60;
    return `${minutos}:${String(segundos).padStart(2, '0')}`;
  }

  get progressoTempo(): number {
    return 1 - this.segundosRestantes / (this.duracao * 60);
  }

  concluirExercicio(): void {
    this.feitos++;
    this.indice++;
  }

  trocarExercicio(): void {
    this.indice++;
  }

  alternarPausa(): void {
    if (this.pausado) {
      this.iniciarTimer();
    } else {
      this.pararTimer();
    }
    this.pausado = !this.pausado;
  }

  terminarAntes(): void {
    if (confirm('Terminar a sessão agora? O tempo feito até aqui conta.')) {
      this.terminar();
    }
  }

  private terminar(): void {
    this.pararTimer();
    const segundosFeitos = this.duracao * 60 - Math.max(this.segundosRestantes, 0);
    this.minutosAtivos = Math.round(segundosFeitos / 60);
    this.fase = 'fim';
  }

  private iniciarTimer(): void {
    this.pararTimer();
    this.timerId = setInterval(() => {
      this.segundosRestantes--;
      if (this.segundosRestantes <= 0) {
        this.terminar();
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private pararTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  get kmTreino(): number {
    return this.treinoService.calcularKm(this.minutosAtivos, this.feitos, this.objetivo);
  }

  get kmReaisValidos(): number {
    if (this.tipo === 'forca' || !this.kmReais || this.kmReais < 0) {
      return 0;
    }
    return Math.min(this.kmReais, 100);
  }

  get kmTotal(): number {
    return Math.round((this.kmTreino + this.kmReaisValidos) * 10) / 10;
  }

  get estadoPrevisto(): EstadoDia {
    if (this.minutosAtivos >= REGRAS.minutosCompleto) return 'completo';
    if (this.minutosAtivos >= REGRAS.minutosSuave) return 'suave';
    return 'falha';
  }

  guardar(): void {
    if (this.guardado) {
      return;
    }
    this.guardado = true;

    this.registoService.registarTreino({
      utilizadorId: this.utilizador!.id,
      jornadaId: this.jornada!.id,
      tipoTreino: this.tipo,
      minutosAtivos: this.minutosAtivos,
      exerciciosFeitos: this.feitos,
      objetivoExercicios: this.objetivo,
      kmGanhos: this.kmTotal,
      kmReais: this.kmReaisValidos || undefined
    });

    this.jornadaService.adicionarKm(this.jornada!, this.kmTotal, this.marcos);
    this.router.navigate(['/condado']);
  }

  ngOnDestroy(): void {
    this.pararTimer();
  }
}