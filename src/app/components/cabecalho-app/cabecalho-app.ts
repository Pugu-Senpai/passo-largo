import { Component, OnInit, HostListener } from '@angular/core';
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
    { rota: '/condado', texto: 'Condado', icone: '🏡' },
    { rota: '/jornada', texto: 'Jornada de hoje', icone: '⚔' },
    { rota: '/exercicios', texto: 'Exercícios', icone: '📜' },
    { rota: '/calendario', texto: 'Calendário', icone: '📅' },
    { rota: '/perfil', texto: 'Perfil', icone: '🧝' }
  ];

  readonly caminhoAvatar = caminhoAvatar;

  constructor(
    private utilizadorService: UtilizadorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
  }

  alternar(): void {
    this.aberto = !this.aberto;
  }

  fechar(): void {
    this.aberto = false;
  }

  trocarAventureiro(): void {
    this.fechar();
    this.utilizadorService.terminarSessao();
    this.router.navigate(['/']);
  }

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    this.fechar();
  }
}