import { Component, HostListener, ElementRef, ViewChild, Injector, Inject, effect, afterNextRender } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ConfirmacaoService } from '../../services/confirmacao.service';

@Component({
  selector: 'app-dialogo-confirmacao',
  imports: [],
  templateUrl: './dialogo-confirmacao.html',
  styleUrl: './dialogo-confirmacao.css'
})
export class DialogoConfirmacao {
  @ViewChild('caixa') caixa?: ElementRef<HTMLElement>;
  @ViewChild('botaoCancelar') botaoCancelar?: ElementRef<HTMLButtonElement>;

  private focoAnterior: HTMLElement | null = null;

  constructor(
    public confirmacao: ConfirmacaoService,
    private injector: Injector,
    @Inject(DOCUMENT) private documento: Document
  ) {
    effect(() => {
      const pedido = this.confirmacao.pedido();

      if (pedido) {
        this.focoAnterior = this.documento.activeElement as HTMLElement | null;
        afterNextRender(() => this.botaoCancelar?.nativeElement.focus(), { injector: this.injector });
      } else if (this.focoAnterior) {
        const alvo = this.focoAnterior;
        this.focoAnterior = null;
        alvo.focus();
      }
    });
  }

  manterFocoDentro(evento: KeyboardEvent): void {
    if (evento.key !== 'Tab') {
      return;
    }
    const focaveis = this.caixa?.nativeElement.querySelectorAll<HTMLElement>('button');
    if (!focaveis || focaveis.length === 0) {
      return;
    }
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const atual = this.documento.activeElement;

    if (evento.shiftKey && atual === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && atual === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    if (this.confirmacao.pedido()) {
      this.confirmacao.responder(false);
    }
  }
}