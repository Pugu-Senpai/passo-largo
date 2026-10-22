import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DadosService } from '../../services/dados.service';
import { Exercicio } from '../../models/exercicio.model';
import { CartaoExercicio } from '../../components/cartao-exercicio/cartao-exercicio';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { Location } from '@angular/common';

@Component({
  selector: 'app-exercicio-detalhe',
  imports: [RouterLink, CartaoExercicio, CabecalhoApp],
  templateUrl: './exercicio-detalhe.html',
  styleUrl: './exercicio-detalhe.css'
})
export class ExercicioDetalhe implements OnInit {
  exercicio?: Exercicio;
  carregando = true;
  erro = false;
  naoEncontrado = false;

  constructor(
    private route: ActivatedRoute,
    private dadosService: DadosService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.naoEncontrado = true;
      this.carregando = false;
      return;
    }

    this.dadosService.obterExercicio(id).subscribe({
      next: (exercicio) => {
        this.exercicio = exercicio;
        this.naoEncontrado = !exercicio;
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

  voltar(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/exercicios']);
    }
  }
}