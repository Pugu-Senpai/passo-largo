import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

/**
 * Janela com uma ilustração e uma mensagem (aviso de falhas, avanço do inimigo,
 * jornada falhada, conquista). Usa o <dialog> nativo do browser, que já trata
 * do fundo escuro, do foco preso dentro da janela e da tecla Escape.
 * O texto da mensagem entra por projeção (<ng-content>).
 */
@Component({
  selector: 'app-cartao-aviso',
  imports: [],
  templateUrl: './cartao-aviso.html',
  styleUrl: './cartao-aviso.css'
})
export class CartaoAviso implements AfterViewInit {
  @Input({ required: true }) imagem!: string;
  @Input({ required: true }) titulo!: string;
  @Input() etiqueta = '';
  @Input() textoBotao = 'Continuar';
  /** retrato: ilustração ao alto (ao lado do texto) · paisagem: ilustração larga (por cima do texto) */
  @Input() formato: 'retrato' | 'paisagem' = 'retrato';
  /** perigo: borda vermelha · conquista: borda dourada */
  @Input() tom: 'perigo' | 'conquista' = 'perigo';

  @Output() continuar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) dialogo!: ElementRef<HTMLDialogElement>;
  @ViewChild('botao', { static: true }) botao!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    const dialogo = this.dialogo.nativeElement;
    if (!dialogo.open) {
      dialogo.showModal();
    }
    dialogo.scrollTop = 0;
    this.botao.nativeElement.focus({ preventScroll: true });
  }

  fechar(): void {
    this.dialogo.nativeElement.close();
  }

  aoFechar(): void {
    this.continuar.emit();
  }
}
