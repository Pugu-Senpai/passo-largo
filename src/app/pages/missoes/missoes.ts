import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { CartaoMissao } from '../../components/cartao-missao/cartao-missao';
import { UtilizadorService } from '../../services/utilizador.service';
import { MissaoService, SemanaHistorico } from '../../services/missao.service';
import { Utilizador } from '../../models/utilizador.model';
import { Missao, MissaoDaSemana } from '../../models/missao.model';
import { diferencaDias, hoje, somarDias } from '../../utils/datas';

@Component({
  selector: 'app-missoes',
  imports: [DatePipe, CabecalhoApp, CartaoMissao],
  templateUrl: './missoes.html',
  styleUrl: './missoes.css'
})
export class Missoes implements OnInit {
  utilizador?: Utilizador;
  carregando = true;
  erro = '';
  missaoAReceber: number | null = null;

  constructor(
    private utilizadorService: UtilizadorService,
    private missaoService: MissaoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.carregar();
  }

  // ===== Dados (lidos dos signals do serviço) =====

  get missoesSemana(): MissaoDaSemana[] {
    return this.utilizador ? this.missaoService.missoesDaSemana(this.utilizador.id) : [];
  }

  get pontosTotais(): number {
    return this.missaoService.pontosTotais();
  }

  get totalConcluidas(): number {
    return this.missaoService.totalConcluidas();
  }

  get historico(): SemanaHistorico[] {
    return this.missaoService.historico();
  }

  get semanaAtual(): string {
    return this.missaoService.semanaAtual();
  }

  /** Dias até domingo, contando com hoje */
  get diasRestantes(): number {
    return diferencaDias(hoje(), somarDias(this.semanaAtual, 6)) + 1;
  }

  // ===== Ações =====

  // Também é chamado pelo botão "Tentar novamente"
  async carregar(): Promise<void> {
    this.carregando = true;
    this.erro = '';
    this.cdr.markForCheck();

    try {
      await this.missaoService.garantirCarregado(this.utilizador!.id);
    } catch (e) {
      this.erro = (e as Error).message;
    } finally {
      this.carregando = false;
      this.cdr.markForCheck();
    }
  }

  async receberPontos(missao: Missao): Promise<void> {
    // Evita pedir os pontos duas vezes com um duplo clique
    if (this.missaoAReceber !== null) {
      return;
    }
    this.missaoAReceber = missao.id;
    this.erro = '';

    try {
      await this.missaoService.receberPontos(this.utilizador!.id, missao.id);
    } catch (e) {
      this.erro = (e as Error).message;
    } finally {
      this.missaoAReceber = null;
      this.cdr.markForCheck();
    }
  }
}
