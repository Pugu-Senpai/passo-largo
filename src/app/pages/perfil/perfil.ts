import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { UtilizadorService } from '../../services/utilizador.service';
import { JornadaService } from '../../services/jornada.service';
import { RegistoService, ResumoAtividade } from '../../services/registo.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';

@Component({
  selector: 'app-perfil',
  imports: [DecimalPipe, DatePipe, CabecalhoApp],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  utilizador?: Utilizador;
  jornada?: Jornada;
  resumo?: ResumoAtividade;
  imc = 0;
  classificacaoImc = '';

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private registoService: RegistoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.carregarDados();
  }

  carregarDados(): void {
    const u = this.utilizador!;
    this.jornada = this.jornadaService.obterOuCriar(u.id);
    this.resumo = this.registoService.resumo(u.id);
    this.imc = this.utilizadorService.calcularImc(u);
    this.classificacaoImc = this.utilizadorService.classificarImc(this.imc);
  }
}