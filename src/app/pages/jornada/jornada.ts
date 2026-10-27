import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector, afterNextRender } from '@angular/core';
import { CartaoExercicio } from '../../components/cartao-exercicio/cartao-exercicio';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { UtilizadorService } from '../../services/utilizador.service';
import { JornadaService } from '../../services/jornada.service';
import { DadosService } from '../../services/dados.service';
import { TreinoService } from '../../services/treino.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada as JornadaModelo } from '../../models/jornada.model';
import { Exercicio } from '../../models/exercicio.model';
import { TipoTreino, Zona, Intensidade, EstadoDia, ModoCardio } from '../../models/tipos';
import { DecimalPipe, ViewportScroller } from '@angular/common';
import { forkJoin, firstValueFrom } from 'rxjs';
import { RegistoService } from '../../services/registo.service';
import { Marco } from '../../models/marco.model';
import { REGRAS } from '../../models/regras';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { MusicaJornada } from '../../components/musica-jornada/musica-jornada';
import { ConfirmacaoService } from '../../services/confirmacao.service';

type Fase = 'escolha' | 'sessao' | 'fim' | 'distancia';

@Component({
  selector: 'app-jornada',
  imports: [RouterLink, FormsModule, ReactiveFormsModule, CartaoExercicio, DecimalPipe, CabecalhoApp, MusicaJornada],
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
  guardado = false;
  erroGuardar = '';
  private registoGuardado = false;
  private kmAdicionados = false;
  private kmGuardados = 0;

  carregando = true;
  erro = false;
  semExercicios = false;
  indice = 0;
  feitos = 0;
  segundosRestantes = 0;
  pausado = false;
  minutosAtivos = 0;

  private timerId?: ReturnType<typeof setInterval>;

  tipo: TipoTreino = 'forca';
  foco: Zona = 'full-body';
  intensidade: Intensidade = 'leve';
  modoCardio: ModoCardio = 'exercicios';

  readonly modosCardio: ModoCardio[] = ['exercicios', 'corrida', 'caminhada'];

  readonly rotuloModoCardio: Record<ModoCardio, string> = {
    exercicios: 'Exercícios',
    corrida: 'Corrida',
    caminhada: 'Caminhada'
  };

  //===== Corrida e caminhada =====
  readonly formDistancia = new FormGroup({
    km: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1), Validators.max(100)]),
    minutos: new FormControl<number | null>(null, [
      Validators.required, Validators.min(1), Validators.max(300), Validators.pattern(/^\d+$/)
    ])
  });

  opcoesFoco: Zona[] = [];
  opcoesIntensidade: Intensidade[] = [];

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

  readonly racaPorTipo: Record<TipoTreino, string> = {
    forca: 'anao',
    cardio: 'elfo',
    misto: 'humano'
  };

  readonly textoTipo: Record<TipoTreino, { titulo: string; frase: string }> = {
    forca: { titulo: 'Força de Anão', frase: 'Firme como a pedra das montanhas.' },
    cardio: { titulo: 'Fôlego de Elfo', frase: 'Leve e incansável pelos caminhos.' },
    misto: { titulo: 'Coragem de Humano', frase: 'Um pouco de tudo, pronto para qualquer estrada.' }
  };

  private readonly DURACAO_SEGUNDOS = REGRAS.minutosCompleto * 60;
  private readonly variante = String(Math.floor(Math.random() * 3) + 1).padStart(2, '0');

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private dadosService: DadosService,
    private treinoService: TreinoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private registoService: RegistoService,
    private confirmacao: ConfirmacaoService,
    private scroller: ViewportScroller,
    private injector: Injector,
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.opcoesFoco = this.treinoService.opcoesFoco(this.utilizador.nivelFisico);
    this.opcoesIntensidade = this.treinoService.opcoesIntensidade(this.utilizador.nivelFisico);
    this.foco = this.opcoesFoco[0];
    this.intensidade = this.opcoesIntensidade[0];

    this.carregarExercicios();
  }

  async carregarExercicios(): Promise<void> {
    this.carregando = true;
    this.erro = false;
    this.cdr.markForCheck();

    try {
      this.jornada = await this.jornadaService.obterOuCriar(this.utilizador!.id);

      const { exercicios, marcos } = await firstValueFrom(forkJoin({
        exercicios: this.dadosService.obterExercicios(),
        marcos: this.dadosService.obterMarcos()
      }));
      if (exercicios.length === 0 || marcos.length === 0) {
        throw new Error('Sem exercícios ou marcos');
      }
      this.exercicios = exercicios;
      this.marcos = marcos;
    } catch (e) {
      console.error('Erro ao preparar a jornada:', (e as Error).message);
      this.erro = true;
    } finally {
      this.carregando = false;
      this.cdr.markForCheck();
    }
  }

  get eDistancia(): boolean {
    return this.tipo === 'cardio' && this.modoCardio !== 'exercicios';
  }

  comecar(): void {
    if (this.eDistancia) {
      this.formDistancia.reset();
      this.semExercicios = false;
      this.fase = 'distancia';
      this.irParaTopo();
      return;
    }

    this.sessao = this.treinoService.sortear(this.exercicios, this.utilizador!, {
      tipo: this.tipo,
      foco: this.foco,
      intensidade: this.intensidade
    });

    this.semExercicios = this.sessao.length === 0;
    if (this.semExercicios) {
      return;
    }

    this.indice = 0;
    this.feitos = 0;
    this.segundosRestantes = this.DURACAO_SEGUNDOS;
    this.pausado = false;
    this.fase = 'sessao';
    this.iniciarTimer();
    this.irParaTopo();
  }

  private irParaTopo(): void {
    afterNextRender(() => this.scroller.scrollToPosition([0, 0]), { injector: this.injector });
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
    return 1 - this.segundosRestantes / this.DURACAO_SEGUNDOS;
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

  async terminarAntes(): Promise<void> {
    const estavaPausado = this.pausado;
    if (!estavaPausado) {
      this.alternarPausa();
    }

    const confirmar = await this.confirmacao.perguntar({
      titulo: 'Terminar a sessão?',
      mensagem: 'O tempo que já fizeste conta para a jornada de hoje.',
      textoConfirmar: 'Terminar',
      textoCancelar: 'Continuar'
    });

    if (confirmar) {
      this.terminar();
    } else if (!estavaPausado) {
      this.alternarPausa();
    }
    this.cdr.markForCheck();
  }

  private terminar(): void {
    this.pararTimer();
    const segundosFeitos = this.DURACAO_SEGUNDOS - Math.max(this.segundosRestantes, 0);
    this.minutosAtivos = Math.round(segundosFeitos / 60);
    this.fase = 'fim';
    this.irParaTopo();
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
    return this.treinoService.calcularKm(this.minutosAtivos, this.feitos);
  }

  get kmTotal(): number {
    if (this.eDistancia) {
      const km = this.formDistancia.controls.km.valid ? this.formDistancia.controls.km.value ?? 0 : 0;
      return Math.round(km * 10) / 10;
    }
    return this.kmTreino;
  }

  get minutosDoDia(): number {
    if (this.eDistancia) {
      return this.formDistancia.controls.minutos.valid ? this.formDistancia.controls.minutos.value ?? 0 : 0;
    }
    return this.minutosAtivos;
  }

  get estadoPrevisto(): EstadoDia {
    return this.minutosDoDia >= REGRAS.minutosCompleto ? 'completo' : 'falha';
  }

  campoDistanciaInvalido(campo: 'km' | 'minutos'): boolean {
    const controlo = this.formDistancia.controls[campo];
    return controlo.invalid && (controlo.touched || controlo.dirty);
  }

  get imagemTipo(): string {
    return `imagens/boneco/boneco-${this.racaPorTipo[this.tipo]}-${this.variante}.png`;
  }

  async guardar(): Promise<void> {
    if (this.guardado) {
      return;
    }

    if (this.eDistancia && this.formDistancia.invalid) {
      this.formDistancia.markAllAsTouched();
      return;
    }

    this.guardado = true;
    this.erroGuardar = '';

    try {
      if (!this.registoGuardado) {
        this.kmGuardados = this.kmTotal;
        await this.registoService.registarTreino({
          utilizadorId: this.utilizador!.id,
          jornadaId: this.jornada!.id,
          tipoTreino: this.tipo,
          minutosAtivos: this.minutosDoDia,
          exerciciosFeitos: this.eDistancia ? 0 : this.feitos,
          kmGanhos: this.kmGuardados,
          kmReais: this.eDistancia ? this.kmGuardados : undefined
        });
        this.registoGuardado = true;
      }

      if (!this.kmAdicionados) {
        await this.jornadaService.adicionarKm(this.jornada!, this.kmGuardados, this.marcos);
        this.kmAdicionados = true;
      }

      await this.router.navigate(['/condado']);
    } catch (e) {
      this.erroGuardar = (e as Error).message;
      this.guardado = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.pararTimer();
  }
}