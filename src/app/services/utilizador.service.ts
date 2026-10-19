import { Injectable } from '@angular/core';
import { Utilizador } from '../models/utilizador.model';

// Os dados que o formulário envia: tudo menos o id e a data, que o Service gera
export type NovoUtilizador = Omit<Utilizador, 'id' | 'dataCriacao'>;

@Injectable({ providedIn: 'root' })
export class UtilizadorService {
  private readonly CHAVE_UTILIZADORES = 'pl_utilizadores';
  private readonly CHAVE_ATIVO = 'pl_utilizador_ativo';

  obterTodos(): Utilizador[] {
    return this.ler();
  }

  obterPorId(id: number): Utilizador | undefined {
    return this.ler().find(u => u.id === id);
  }

  criar(dados: NovoUtilizador): Utilizador {
    const utilizadores = this.ler();
    const novo: Utilizador = {
      ...dados,
      id: utilizadores.length ? Math.max(...utilizadores.map(u => u.id)) + 1 : 1,
      dataCriacao: new Date().toISOString().slice(0, 10)
    };
    utilizadores.push(novo);
    this.guardar(utilizadores);
    return novo;
  }

  atualizar(atualizado: Utilizador): void {
    const utilizadores = this.ler().map(u => u.id === atualizado.id ? atualizado : u);
    this.guardar(utilizadores);
  }

  apagar(id: number): void {
    if (this.obterAtivo()?.id === id) {
      this.terminarSessao();
    }
    this.guardar(this.ler().filter(u => u.id !== id));
  }

  definirAtivo(id: number): void {
    localStorage.setItem(this.CHAVE_ATIVO, String(id));
  }

  obterAtivo(): Utilizador | undefined {
    const id = Number(localStorage.getItem(this.CHAVE_ATIVO));
    return id ? this.obterPorId(id) : undefined;
  }

  terminarSessao(): void {
    localStorage.removeItem(this.CHAVE_ATIVO);
  }

  private ler(): Utilizador[] {
    try {
      const texto = localStorage.getItem(this.CHAVE_UTILIZADORES);
      return texto ? JSON.parse(texto) : [];
    } catch {
      return [];
    }
  }

  private guardar(utilizadores: Utilizador[]): void {
    localStorage.setItem(this.CHAVE_UTILIZADORES, JSON.stringify(utilizadores));
  }
}