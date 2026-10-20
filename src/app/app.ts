import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TemaService } from './services/tema.service';
import { DialogoConfirmacao } from './components/dialogo-confirmacao/dialogo-confirmacao';

@Component({
  imports: [RouterOutlet, DialogoConfirmacao],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('passo-largo');

  constructor(private temaService: TemaService) {
    this.temaService.aplicar(); 
  }
}