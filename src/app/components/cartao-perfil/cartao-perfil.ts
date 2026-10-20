import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Utilizador } from '../../models/utilizador.model';
import { caminhoAvatar } from '../../models/avatares';

@Component({
  selector: 'app-cartao-perfil',
  imports: [],
  templateUrl: './cartao-perfil.html',
  styleUrl: './cartao-perfil.css'
})
export class CartaoPerfil {
  @Input({ required: true }) utilizador!: Utilizador;
  @Input() modoGestao = false;

  @Output() selecionado = new EventEmitter<Utilizador>();
  @Output() apagar = new EventEmitter<Utilizador>();

  readonly caminhoAvatar = caminhoAvatar;

  aoSelecionar(): void {
    this.selecionado.emit(this.utilizador);
  }

  aoApagar(): void {
    this.apagar.emit(this.utilizador);
  }
}