import { Component, HostListener, ElementRef, ViewChild, Injector, afterNextRender } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UtilizadorService } from '../../services/utilizador.service';
import { Utilizador } from '../../models/utilizador.model';
import { NivelFisico } from '../../models/tipos';
import { caminhoAvatar } from '../../models/avatares';
import { AuthService } from '../../services/auth.service';

type MenuAberto = 'principal' | 'perfil' | null;

@Component({
  selector: 'app-cabecalho-app',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './cabecalho-app.html',
  styleUrl: './cabecalho-app.css'
})
export class CabecalhoApp {
  aberto: MenuAberto = null;

  readonly links = [
    { rota: '/condado', texto: 'Condado', icone: 'imagens/marcos/porta.svg' },
    { rota: '/jornada', texto: 'Jornada de hoje', icone: 'imagens/icones/jornada.svg' },
    { rota: '/exercicios', texto: 'Exercícios', icone: 'imagens/icones/livro.svg' },
    { rota: '/calendario', texto: 'Calendário', icone: 'imagens/icones/calendario.svg' },
    { rota: '/missoes', texto: 'Missões', icone: 'imagens/icones/pergaminho.svg' },
  ];

  readonly rotuloNivel: Record<NivelFisico, string> = {
    'sedentario': 'Sedentário',
    'pouco-ativo': 'Pouco ativo',
    'ativo': 'Ativo',
    'muito-ativo': 'Muito ativo'
  };

  readonly caminhoAvatar = caminhoAvatar;

  @ViewChild('botaoMenu') botaoMenu?: ElementRef<HTMLButtonElement>;
  @ViewChild('botaoPerfil') botaoPerfil?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuPrincipal') menuPrincipal?: ElementRef<HTMLElement>;
  @ViewChild('menuPerfil') menuPerfil?: ElementRef<HTMLElement>;

  constructor(
    private utilizadorService: UtilizadorService,
    private router: Router,
    private injector: Injector,
    private host: ElementRef<HTMLElement>,
    private auth: AuthService,
  ) { }

  get utilizador(): Utilizador | undefined {
    return this.utilizadorService.obterAtivo();
  }

  alternar(qual: 'principal' | 'perfil'): void {
    this.aberto = this.aberto === qual ? null : qual;

    if (this.aberto) {
      const painel = this.aberto === 'principal' ? this.menuPrincipal : this.menuPerfil;
      afterNextRender(() => {
        painel?.nativeElement.querySelector<HTMLElement>('a, button')?.focus();
      }, { injector: this.injector });
    }
  }

  fechar(): void {
    this.aberto = null;
  }

  trocarAventureiro(): void {
    this.fechar();
    this.utilizadorService.terminarSessao();
    this.router.navigate(['/']);
  }

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    if (!this.aberto) {
      return;
    }
    const botao = this.aberto === 'principal' ? this.botaoMenu : this.botaoPerfil;
    this.fechar();
    botao?.nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: Event): void {
    if (this.aberto && !this.host.nativeElement.contains(evento.target as Node)) {
      this.fechar();
    }
  }

  async terminarSessao(): Promise<void> {
    this.fechar();
    await this.auth.sair();
  }
}