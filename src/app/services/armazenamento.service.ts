import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ArmazenamentoService {

  ler<T>(chave: string, valorPadrao: T): T {
    try {
      const texto = localStorage.getItem(chave);
      return texto ? (JSON.parse(texto) as T) : valorPadrao;
    } catch {
      return valorPadrao;
    }
  }

  guardar<T>(chave: string, valor: T): void {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
      console.error(`Não foi possível guardar "${chave}"`, erro);
    }
  }

  remover(chave: string): void {
    localStorage.removeItem(chave);
  }
}