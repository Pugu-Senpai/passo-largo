import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { UtilizadorService, NovoUtilizador } from '../../services/utilizador.service';
import { JornadaService } from '../../services/jornada.service';
import { RegistoService, ResumoAtividade } from '../../services/registo.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { FormularioPerfil } from '../../components/formulario-perfil/formulario-perfil';
import { caminhoAvatar } from '../../models/avatares';
import { MissaoService } from '../../services/missao.service';

@Component({
  selector: 'app-perfil',
  imports: [DecimalPipe, DatePipe, RouterLink, CabecalhoApp, FormularioPerfil, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  utilizador?: Utilizador;
  jornada?: Jornada;
  resumo?: ResumoAtividade;
  imc = 0;
  classificacaoImc = '';
  editar = false;
  mensagem = '';
  erro = '';
  aGuardar = false;
  erroMissoes = false;

  readonly caminhoAvatar = caminhoAvatar;

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private registoService: RegistoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private missaoService: MissaoService,
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.carregarDados();
    this.carregarMissoes();
  }

  // ===== Missões =====

  get pontosTotais(): number {
    return this.missaoService.pontosTotais();
  }

  get missoesConcluidas(): number {
    return this.missaoService.totalConcluidas();
  }

  private async carregarMissoes(): Promise<void> {
    try {
      await this.missaoService.garantirCarregado(this.utilizador!.id);
    } catch {
      this.erroMissoes = true;
      this.cdr.markForCheck();
    }
  }

  carregarDados(): void {
    const u = this.utilizador!;
    this.jornada = this.jornadaService.obterAtiva(u.id) ?? this.jornadaService.obterUltima(u.id);
    this.resumo = this.registoService.resumo(u.id);
    this.imc = this.utilizadorService.calcularImc(u);
    this.classificacaoImc = this.utilizadorService.classificarImc(this.imc);
  }

  iniciarEdicao(): void {
    this.editar = true;
    this.mensagem = '';
    this.erro = '';
  }

  cancelarEdicao(): void {
    this.editar = false;
  }

  async guardarAlteracoes(dados: NovoUtilizador): Promise<void> {
    if (this.aGuardar) {
      return;
    }
    this.aGuardar = true;
    this.erro = '';

    try {
      this.utilizador = await this.utilizadorService.atualizar({ ...this.utilizador!, ...dados });
      this.carregarDados();
      this.editar = false;
      this.mensagem = 'Alterações guardadas.';
    } catch (e) {
      this.erro = (e as Error).message;
    } finally {
      this.aGuardar = false;
      this.cdr.markForCheck();
    }
  }
}