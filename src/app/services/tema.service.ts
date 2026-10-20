import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ArmazenamentoService } from './armazenamento.service';

export type Tema = 'automatico' | 'claro' | 'escuro';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly CHAVE = 'pl_tema';

  constructor(
    private armazenamento: ArmazenamentoService,
    @Inject(DOCUMENT) private documento: Document
  ) {}

  obter(): Tema {
    return this.armazenamento.ler<Tema>(this.CHAVE, 'automatico');
  }

  definir(tema: Tema): void {
    this.armazenamento.guardar(this.CHAVE, tema);
    this.aplicar(tema);
  }

  aplicar(tema: Tema = this.obter()): void {
    const raiz = this.documento.documentElement;
    if (tema === 'automatico') {
      raiz.removeAttribute('data-tema');
    } else {
      raiz.setAttribute('data-tema', tema);
    }
  }
}