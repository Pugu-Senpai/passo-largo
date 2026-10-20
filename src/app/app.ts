import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TemaService } from './services/tema.service';

@Component({
  imports: [RouterOutlet],
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