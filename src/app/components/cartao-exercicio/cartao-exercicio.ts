import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercicio } from '../../models/exercicio.model';

@Component({
  selector: 'app-cartao-exercicio',
  imports: [],
  templateUrl: './cartao-exercicio.html',
  styleUrl: './cartao-exercicio.css'
})
export class CartaoExercicio {
  @Input({ required: true }) exercicio!: Exercicio;
  @Input() numero = 1;
  @Input() mostrarAcoes = true;

  @Output() concluido = new EventEmitter<Exercicio>();
  @Output() trocado = new EventEmitter<Exercicio>();

  readonly rotuloMusculo: Record<string, string> = {
    peito: 'Peito', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps',
    abdominais: 'Abdominais', obliquos: 'Oblíquos', costas: 'Costas', lombar: 'Lombar',
    gluteos: 'Glúteos', quadriceps: 'Quadríceps', isquiotibiais: 'Isquiotibiais', gemeos: 'Gémeos'
  };

  aoConcluir(): void {
    this.concluido.emit(this.exercicio);
  }

  aoTrocar(): void {
    this.trocado.emit(this.exercicio);
  }
}