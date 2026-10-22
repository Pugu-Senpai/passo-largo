import { Component, Inject, Injector, afterNextRender, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { TemaService } from './services/tema.service';
import { DialogoConfirmacao } from './components/dialogo-confirmacao/dialogo-confirmacao';

@Component({
  imports: [RouterOutlet, DialogoConfirmacao],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('passo-largo');
  protected readonly anuncio = signal('');
  private primeiraNavegacao = true;

  constructor(
    private temaService: TemaService,
    private router: Router,
    private titulo: Title,
    private injector: Injector,
    @Inject(DOCUMENT) private documento: Document
  ) {
    this.temaService.aplicar();

    this.router.events
      .pipe(
        filter(evento => evento instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.aoMudarDePagina());
  }

  saltarParaConteudo(): void {
    const principal = this.documento.querySelector('main');
    if (principal) {
      principal.setAttribute('tabindex', '-1');
      principal.focus({ preventScroll: true });
    }
  }

  private aoMudarDePagina(): void {
    if (this.primeiraNavegacao) {
      this.primeiraNavegacao = false;
      return;
    }

    // Espera que a página nova seja desenhada antes de mover o foco
    afterNextRender(() => {
      this.saltarParaConteudo();
      this.anuncio.set(this.titulo.getTitle());
    }, { injector: this.injector });
  }
}