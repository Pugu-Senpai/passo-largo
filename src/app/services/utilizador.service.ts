import { Injectable } from '@angular/core';
import { Utilizador } from '../models/utilizador.model';
import { ArmazenamentoService } from './armazenamento.service';
import { hoje } from '../utils/datas';
import { JornadaService } from './jornada.service';
import { RegistoService } from './registo.service';

export type NovoUtilizador = Omit<Utilizador, 'id' | 'dataCriacao'>;

@Injectable({ providedIn: 'root' })
export class UtilizadorService {
  private readonly CHAVE_UTILIZADORES = 'pl_utilizadores';
  private readonly CHAVE_ATIVO = 'pl_utilizador_ativo';

  constructor(
    private armazenamento: ArmazenamentoService,
    private jornadaService: JornadaService,
    private registoService: RegistoService
  ) { }

  obterTodos(): Utilizador[] {
    return this.armazenamento.ler<Utilizador[]>(this.CHAVE_UTILIZADORES, []);
  }

  obterPorId(id: number): Utilizador | undefined {
    return this.obterTodos().find(u => u.id === id);
  }

  criar(dados: NovoUtilizador): Utilizador {
    const utilizadores = this.obterTodos();
    const novo: Utilizador = {
      ...dados,
      id: this.armazenamento.proximoId(utilizadores),
      dataCriacao: hoje(),
    };
    this.armazenamento.guardar(this.CHAVE_UTILIZADORES, [...utilizadores, novo]);
    return novo;
  }

  atualizar(atualizado: Utilizador): void {
    const utilizadores = this.obterTodos().map(u => u.id === atualizado.id ? atualizado : u);
    this.armazenamento.guardar(this.CHAVE_UTILIZADORES, utilizadores);
  }

  apagar(id: number): void {
    if (this.obterAtivo()?.id === id) {
      this.terminarSessao();
    }
    this.registoService.apagarDoUtilizador(id);
    this.jornadaService.apagarDoUtilizador(id);

    const restantes = this.obterTodos().filter(u => u.id !== id);
    this.armazenamento.guardar(this.CHAVE_UTILIZADORES, restantes);
  }

  definirAtivo(id: number): void {
    this.armazenamento.guardar(this.CHAVE_ATIVO, id);
  }

  obterAtivo(): Utilizador | undefined {
    const id = this.armazenamento.ler<number | null>(this.CHAVE_ATIVO, null);
    return id ? this.obterPorId(id) : undefined;
  }

  terminarSessao(): void {
    this.armazenamento.remover(this.CHAVE_ATIVO);
  }

  calcularImc(utilizador: Utilizador): number {
    const alturaMetros = utilizador.altura / 100;
    const imc = utilizador.peso / (alturaMetros * alturaMetros);
    return Math.round(imc * 10) / 10;
  }

  classificarImc(imc: number): string {
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Excesso de peso';
    return 'Obesidade';
  }
}