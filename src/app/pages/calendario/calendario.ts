import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UtilizadorService } from '../../services/utilizador.service';
import { RegistoService } from '../../services/registo.service';
import { Utilizador } from '../../models/utilizador.model';
import { EstadoDia } from '../../models/tipos';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { hoje, inicioSemana, somarDias, paraTextoData, paraData } from '../../utils/datas';

interface DiaCalendario {
  data: string;
  numero: number;
  doMes: boolean;
  eHoje: boolean;
  estado?: EstadoDia;
}

@Component({
  selector: 'app-calendario',
  imports: [DatePipe, CabecalhoApp],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {
  utilizador?: Utilizador;
  mesAtual = new Date();
  dias: DiaCalendario[] = [];

  readonly diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  readonly rotuloEstado: Record<EstadoDia, string> = {
    completo: 'avanço completo',
    descanso: 'acampamento',
    falha: 'falha'
  };

  private estados = new Map<string, EstadoDia>();

  constructor(
    private utilizadorService: UtilizadorService,
    private registoService: RegistoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }

    const registos = this.registoService.obterDoUtilizador(this.utilizador.id);
    this.estados = new Map(registos.map(r => [r.data, r.estado]));

    const agora = new Date();
    this.mesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    this.gerar();
  }

  // ===== Navegação entre meses =====

  mesAnterior(): void {
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth();
    this.mesAtual = new Date(ano, mes - 1, 1);
    this.gerar();
  }

  mesSeguinte(): void {
    if (this.eMesCorrente) {
      return;
    }
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth();
    this.mesAtual = new Date(ano, mes + 1, 1);
    this.gerar();
  }

  get eMesCorrente(): boolean {
    const agora = new Date();
    return this.mesAtual.getFullYear() === agora.getFullYear()
      && this.mesAtual.getMonth() === agora.getMonth();
  }

  // ===== Construção da grelha =====

  private gerar(): void {
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth();
    const primeiro = paraTextoData(new Date(ano, mes, 1));
    const ultimo = paraTextoData(new Date(ano, mes + 1, 0));
    const dataHoje = hoje();

    let data = inicioSemana(primeiro);
    const fim = somarDias(inicioSemana(ultimo), 6);

    this.dias = [];
    while (data <= fim) {
      this.dias.push({
        data,
        numero: paraData(data).getDate(),
        doMes: data >= primeiro && data <= ultimo,
        eHoje: data === dataHoje,
        estado: this.estados.get(data)
      });
      data = somarDias(data, 1);
    }
  }

  // ===== Resumo do mês =====

  contar(estado: EstadoDia): number {
    return this.dias.filter(d => d.doMes && d.estado === estado).length;
  }
}