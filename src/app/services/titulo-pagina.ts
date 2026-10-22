import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class TituloPagina extends TitleStrategy {

  constructor(private titulo: Title) {
    super();
  }

  override updateTitle(estado: RouterStateSnapshot): void {
    const tituloRota = this.buildTitle(estado);
    console.log('Título da rota:', tituloRota);
    this.titulo.setTitle(tituloRota ? `${tituloRota} · Passo Largo` : 'Passo Largo');
  }
  
}