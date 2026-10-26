import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-conselho-mago',
  imports: [],
  templateUrl: './conselho-mago.html',
  styleUrl: './conselho-mago.css'
})
export class ConselhoMago {
  @Input({ required: true }) frase!: string;
  @Output() fechar = new EventEmitter<void>();

  aoFechar(): void {
    this.fechar.emit();
  }

  // No teclado, Escape também fecha
  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    this.fechar.emit();
  }
}
