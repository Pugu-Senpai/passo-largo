import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UtilizadorService, NovoUtilizador } from '../../services/utilizador.service';
import { FormularioPerfil } from '../../components/formulario-perfil/formulario-perfil';

@Component({
  selector: 'app-novo-perfil',
  imports: [FormularioPerfil],
  templateUrl: './novo-perfil.html',
  styleUrl: './novo-perfil.css'
})
export class NovoPerfil {
  readonly aGuardar = signal(false);
  readonly erro = signal<string | null>(null);

  constructor(
    private utilizadorService: UtilizadorService,
    private router: Router
  ) {}

  async criar(dados: NovoUtilizador): Promise<void> {
    if (this.aGuardar()) {
      return;
    }
    this.aGuardar.set(true);
    this.erro.set(null);

    try {
      const novo = await this.utilizadorService.criar(dados);
      this.utilizadorService.definirAtivo(novo.id);
      await this.router.navigate(['/condado']);
    } catch (e) {
      this.erro.set((e as Error).message);
    } finally {
      this.aGuardar.set(false);
    }
  }

  voltar(): void {
    this.router.navigate(['/']);
  }
}