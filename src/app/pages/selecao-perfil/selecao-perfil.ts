import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UtilizadorService } from '../../services/utilizador.service';
import { ConfirmacaoService } from '../../services/confirmacao.service';
import { Utilizador } from '../../models/utilizador.model';
import { CartaoPerfil } from '../../components/cartao-perfil/cartao-perfil';

@Component({
  selector: 'app-selecao-perfil',
  imports: [RouterLink, CartaoPerfil],
  templateUrl: './selecao-perfil.html',
  styleUrl: './selecao-perfil.css'
})
export class SelecaoPerfil implements OnInit {
  utilizadores: Utilizador[] = [];
  modoGestao = false;

  constructor(
    private utilizadorService: UtilizadorService,
    private confirmacao: ConfirmacaoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.utilizadores = this.utilizadorService.obterTodos();
    if (this.utilizadores.length === 0) {
      this.modoGestao = false;
    }
  }

  alternarGestao(): void {
    this.modoGestao = !this.modoGestao;
  }

  entrar(utilizador: Utilizador): void {
    this.utilizadorService.definirAtivo(utilizador.id);
    this.router.navigate(['/condado']);
  }

  async apagar(utilizador: Utilizador): Promise<void> {
    const confirmar = await this.confirmacao.perguntar({
      titulo: 'Apagar perfil?',
      mensagem: `Todo o progresso de ${utilizador.nome} será eliminado e não pode ser recuperado.`,
      textoConfirmar: 'Apagar',
      perigoso: true
    });

    if (confirmar) {
      this.utilizadorService.apagar(utilizador.id);
      this.carregar();
    }
  }
}