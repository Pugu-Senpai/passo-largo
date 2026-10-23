import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UtilizadorService } from '../../services/utilizador.service';
import { ConfirmacaoService } from '../../services/confirmacao.service';
import { Utilizador } from '../../models/utilizador.model';
import { CartaoPerfil } from '../../components/cartao-perfil/cartao-perfil';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-selecao-perfil',
  imports: [RouterLink, CartaoPerfil],
  templateUrl: './selecao-perfil.html',
  styleUrl: './selecao-perfil.css'
})
export class SelecaoPerfil {
  modoGestao = false;
  readonly erro = signal<string | null>(null);

  constructor(
    private utilizadorService: UtilizadorService,
    private confirmacao: ConfirmacaoService,
    private router: Router,
    private auth: AuthService,
  ) { }

  get utilizadores(): Utilizador[] {
    return this.utilizadorService.aventureiros();
  }

  get erroCarga(): string | null {
    return this.utilizadorService.erroCarga();
  }

  async tentarDeNovo(): Promise<void> {
    await this.utilizadorService.garantirCarregado();
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
    if (!confirmar) {
      return;
    }

    this.erro.set(null);
    try {
      await this.utilizadorService.apagar(utilizador.id);
      if (this.utilizadores.length === 0) {
        this.modoGestao = false;
      }
    } catch (e) {
      this.erro.set((e as Error).message);
    }
  }

  get emailConta(): string {
    return this.auth.sessao()?.user.email ?? '';
  }

  async terminarSessao(): Promise<void> {
    await this.auth.sair();
  }
}