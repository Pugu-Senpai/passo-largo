import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilizadorService } from '../../services/utilizador.service';
import { TemaService, Tema } from '../../services/tema.service';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';

@Component({
  selector: 'app-definicoes',
  imports: [FormsModule, CabecalhoApp],
  templateUrl: './definicoes.html',
  styleUrl: './definicoes.css'
})
export class Definicoes implements OnInit {
  tema: Tema = 'automatico';

  constructor(
    private utilizadorService: UtilizadorService,
    private temaService: TemaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.utilizadorService.obterAtivo()) {
      this.router.navigate(['/']);
      return;
    }
    this.tema = this.temaService.obter();
  }

  mudarTema(tema: Tema): void {
    this.temaService.definir(tema);
  }
}