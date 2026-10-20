import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { UtilizadorService, NovoUtilizador } from '../../services/utilizador.service';
import { JornadaService } from '../../services/jornada.service';
import { RegistoService, ResumoAtividade } from '../../services/registo.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { FormularioPerfil } from '../../components/formulario-perfil/formulario-perfil';
import { TemaService, Tema } from '../../services/tema.service';
import { ConfirmacaoService } from '../../services/confirmacao.service';
import { caminhoAvatar } from '../../models/avatares';

@Component({
  selector: 'app-perfil',
  imports: [DecimalPipe, DatePipe, CabecalhoApp, FormularioPerfil, FormsModule],
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
  tema: Tema = 'automatico';

  readonly caminhoAvatar = caminhoAvatar;

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private registoService: RegistoService,
    private router: Router,
    private temaService: TemaService,
    private confirmacao: ConfirmacaoService,
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.carregarDados();
    this.tema = this.temaService.obter();
  }

  carregarDados(): void {
    const u = this.utilizador!;
    this.jornada = this.jornadaService.obterOuCriar(u.id);
    this.resumo = this.registoService.resumo(u.id);
    this.imc = this.utilizadorService.calcularImc(u);
    this.classificacaoImc = this.utilizadorService.classificarImc(this.imc);
  }

  iniciarEdicao(): void {
    this.editar = true;
    this.mensagem = '';
  }

  cancelarEdicao(): void {
    this.editar = false;
  }

  guardarAlteracoes(dados: NovoUtilizador): void {
    const atualizado: Utilizador = { ...this.utilizador!, ...dados };
    this.utilizadorService.atualizar(atualizado);
    this.utilizador = atualizado;
    this.carregarDados();
    this.editar = false;
    this.mensagem = 'Alterações guardadas.';
  }

  mudarTema(tema: Tema): void {
    this.temaService.definir(tema);
  }

  async apagarPerfil(): Promise<void> {
    const confirmar = await this.confirmacao.perguntar({
      titulo: 'Apagar perfil?',
      mensagem: `Todo o progresso de ${this.utilizador!.nome} será eliminado e não pode ser recuperado.`,
      textoConfirmar: 'Apagar',
      perigoso: true
    });

    if (confirmar) {
      this.utilizadorService.apagar(this.utilizador!.id);
      this.router.navigate(['/']);
    }
  }
}