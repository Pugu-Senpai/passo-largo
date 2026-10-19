import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

type Fase = 'escolha' | 'sessao' | 'fim';

@Component({
  selector: 'app-jornada',
  imports: [RouterLink, FormsModule],
  templateUrl: './jornada.html',
  styleUrl: './jornada.css'
})
export class Jornada implements OnInit {
  fase: Fase = 'escolha';

  utilizador?: Utilizador;
  jornada?: JornadaModelo;
  exercicios: Exercicio[] = [];
  sessao: Exercicio[] = [];

  carregando = true;
  erro = false;
  semExercicios = false;

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
    private cdr: ChangeDetectorRef
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

    this.dadosService.obterExercicios().subscribe({
      next: (exercicios) => {
        if (!Array.isArray(exercicios) || exercicios.length === 0) {
          this.erro = true;
        } else {
          this.exercicios = exercicios;
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
    if (!this.semExercicios) {
      this.fase = 'sessao';
    }
  }
}