import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

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
  @Input() formato: 'retrato' | 'paisagem' = 'retrato';
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
