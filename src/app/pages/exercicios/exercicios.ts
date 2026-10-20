import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DadosService } from '../../services/dados.service';
import { Exercicio } from '../../models/exercicio.model';
import { Zona } from '../../models/tipos';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';

@Component({
  selector: 'app-exercicios',
  imports: [RouterLink, FormsModule, CabecalhoApp],
  templateUrl: './exercicios.html',
  styleUrl: './exercicios.css'
})
export class Exercicios implements OnInit {
  exercicios: Exercicio[] = [];
  carregando = true;
  erro = false;

  pesquisa = '';
  filtroTipo: 'todos' | 'forca' | 'cardio' = 'todos';
  filtroZona: 'todas' | Zona = 'todas';

  readonly rotuloZona: Record<Zona, string> = {
    'full-body': 'Corpo inteiro',
    'upper': 'Parte superior',
    'lower': 'Parte inferior'
  };

  constructor(
    private dadosService: DadosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.erro = false;

    this.dadosService.obterExercicios().subscribe({
      next: (exercicios) => {
        if (Array.isArray(exercicios)) {
          this.exercicios = exercicios;
        } else {
          this.erro = true;
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

  get filtrados(): Exercicio[] {
    const termo = this.normalizar(this.pesquisa);

    return this.exercicios.filter(e =>
      this.normalizar(e.nome).includes(termo) &&
      (this.filtroTipo === 'todos' || e.tipo === this.filtroTipo) &&
      (this.filtroZona === 'todas' || e.zona === this.filtroZona)
    );
  }

  get temFiltros(): boolean {
    return this.pesquisa !== '' || this.filtroTipo !== 'todos' || this.filtroZona !== 'todas';
  }

  limparFiltros(): void {
    this.pesquisa = '';
    this.filtroTipo = 'todos';
    this.filtroZona = 'todas';
  }

  // Tira acentos e maiúsculas: "Glúteos" e "gluteos" ficam iguais
  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}