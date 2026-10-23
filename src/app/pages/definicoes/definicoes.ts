import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilizadorService } from '../../services/utilizador.service';
import { TemaService, Tema } from '../../services/tema.service';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { Utilizador } from '../../models/utilizador.model';
import { ConfirmacaoService } from '../../services/confirmacao.service';

@Component({
  selector: 'app-definicoes',
  imports: [FormsModule, CabecalhoApp],
  templateUrl: './definicoes.html',
  styleUrl: './definicoes.css',
})
export class Definicoes implements OnInit {
  tema: Tema = 'automatico';
  utilizador?: Utilizador;

  constructor(
    private utilizadorService: UtilizadorService,
    private temaService: TemaService,
    private router: Router,
    private confirmacao: ConfirmacaoService,
  ) { }

  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.tema = this.temaService.obter();
  }

  async apagarPerfil(): Promise<void> {
    const confirmar = await this.confirmacao.perguntar({
      titulo: 'Apagar perfil?',
      mensagem: `Todo o progresso de ${this.utilizador!.nome} será eliminado e não pode ser recuperado.`,
      textoConfirmar: 'Apagar',
      perigoso: true
    });

    if (!confirmar) {
      return;
    }

    this.erro.set(null);
    try {
      await this.utilizadorService.apagar(this.utilizador!.id);
      await this.router.navigate(['/']);
    } catch (e) {
      this.erro.set((e as Error).message);
    }
  }

  mudarTema(tema: Tema): void {
    this.temaService.definir(tema);
  }
}