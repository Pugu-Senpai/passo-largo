import { Component, OnInit, HostListener, ElementRef, ViewChild, Injector, afterNextRender } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UtilizadorService } from '../../services/utilizador.service';
import { Utilizador } from '../../models/utilizador.model';
import { caminhoAvatar } from '../../models/avatares';

@Component({
  selector: 'app-cabecalho-app',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './cabecalho-app.html',
  styleUrl: './cabecalho-app.css'
})
export class CabecalhoApp implements OnInit {
  aberto = false;
  utilizador?: Utilizador;

  readonly links = [
    { rota: '/condado', texto: 'Condado', icone: 'imagens/marcos/porta.svg' },
    { rota: '/jornada', texto: 'Jornada de hoje', icone: 'imagens/icones/jornada.svg' },
    { rota: '/exercicios', texto: 'Exercícios', icone: 'imagens/icones/livro.svg' },
    { rota: '/calendario', texto: 'Calendário', icone: 'imagens/icones/calendario.svg' },
    { rota: '/perfil', texto: 'Perfil', icone: 'imagens/icones/perfil.svg' }
  ];

  readonly caminhoAvatar = caminhoAvatar;

  @ViewChild('botaoMenu') botaoMenu?: ElementRef<HTMLButtonElement>;
  @ViewChild('menu') menu?: ElementRef<HTMLElement>;

  constructor(
    private utilizadorService: UtilizadorService,
    private router: Router,
    private injector: Injector,
    private host: ElementRef<HTMLElement>
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
  }

  fechar(): void {
    this.aberto = false;
  }

  trocarAventureiro(): void {
    this.fechar();
    this.utilizadorService.terminarSessao();
    this.router.navigate(['/']);
  }

  alternar(): void {
    this.aberto = !this.aberto;
    if (this.aberto) {
      afterNextRender(() => {
        this.menu?.nativeElement.querySelector<HTMLElement>('a')?.focus();
      }, { injector: this.injector });
    }
  }

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    if (this.aberto) {
      this.fechar();
      this.botaoMenu?.nativeElement.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: Event): void {
    if (this.aberto && !this.host.nativeElement.contains(evento.target as Node)) {
      this.fechar();
    }
  }
}