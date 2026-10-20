import { Component } from '@angular/core';
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

  constructor(
    private utilizadorService: UtilizadorService,
    private router: Router
  ) {}

  criar(dados: NovoUtilizador): void {
    const novo = this.utilizadorService.criar(dados);
    this.utilizadorService.definirAtivo(novo.id);
    this.router.navigate(['/condado']);
  }

  voltar(): void {
    this.router.navigate(['/']);
  }
}