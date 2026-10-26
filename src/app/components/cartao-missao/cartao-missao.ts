import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Missao, MissaoDaSemana } from '../../models/missao.model';

@Component({
  selector: 'app-cartao-missao',
  imports: [DecimalPipe],
  templateUrl: './cartao-missao.html',
  styleUrl: './cartao-missao.css'
})
export class CartaoMissao {
  @Input({ required: true }) item!: MissaoDaSemana;
  @Input() aReceber = false;

  @Output() receber = new EventEmitter<Missao>();

  /** O progresso mostrado nunca passa da meta (ex.: 3 de 2 dias aparece como 2 de 2) */
  get valor(): number {
    return Math.min(this.item.progresso, this.item.missao.meta);
  }

  get percentagem(): number {
    return (this.valor / this.item.missao.meta) * 100;
  }

  get unidade(): string {
    switch (this.item.missao.criterio) {
      case 'km':
        return 'km';
      case 'exercicios':
        return 'exercícios';
      default:
        return this.item.missao.meta === 1 ? 'dia' : 'dias';
    }
  }

  aoReceber(): void {
    this.receber.emit(this.item.missao);
  }
}
