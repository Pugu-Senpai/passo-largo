import { Injectable, signal } from '@angular/core';

export interface OpcoesConfirmacao {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigoso?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  readonly pedido = signal<OpcoesConfirmacao | null>(null);
  private resolver?: (resposta: boolean) => void;

  perguntar(opcoes: OpcoesConfirmacao): Promise<boolean> {
    this.pedido.set(opcoes);
    return new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });
  }

  responder(resposta: boolean): void {
    this.pedido.set(null);
    this.resolver?.(resposta);
    this.resolver = undefined;
  }
}