import { Component, HostListener } from '@angular/core';
import { ConfirmacaoService } from '../../services/confirmacao.service';

@Component({
  selector: 'app-dialogo-confirmacao',
  imports: [],
  templateUrl: './dialogo-confirmacao.html',
  styleUrl: './dialogo-confirmacao.css'
})
export class DialogoConfirmacao {

  constructor(public confirmacao: ConfirmacaoService) {}

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    if (this.confirmacao.pedido()) {
      this.confirmacao.responder(false);
    }
  }
}