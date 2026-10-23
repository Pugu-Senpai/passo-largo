import { Injectable, inject, signal } from '@angular/core';
import { Utilizador } from '../models/utilizador.model';
import { Genero, NivelFisico } from '../models/tipos';
import { ArmazenamentoService } from './armazenamento.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { JornadaService } from './jornada.service';
import { RegistoService } from './registo.service';

export type NovoUtilizador = Omit<Utilizador, 'id' | 'dataCriacao'>;

interface LinhaAventureiro {
  id: number;
  nome: string;
  genero: Genero;
  avatar: string;
  idade: number;
  peso: number;
  altura: number;
  tem_kettlebell: boolean;
  nivel_fisico: NivelFisico;
  dias_descanso_semana: 1 | 2;
  data_criacao: string;
}

const COLUNAS =
  'id, nome, genero, avatar, idade, peso, altura, tem_kettlebell, nivel_fisico, dias_descanso_semana, data_criacao';

@Injectable({ providedIn: 'root' })
export class UtilizadorService {
  private readonly CHAVE_ATIVO = 'pl_utilizador_ativo';

  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly armazenamento = inject(ArmazenamentoService);
  private readonly jornadaService = inject(JornadaService);
  private readonly registoService = inject(RegistoService);

  private readonly lista = signal<Utilizador[]>([]);
  readonly aventureiros = this.lista.asReadonly();
  readonly erroCarga = signal<string | null>(null);

  private contaCarregada: string | null = null;
  private pedidoEmCurso: Promise<void> | null = null;

  constructor() {
    this.supabase.cliente.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        this.limparMemoria();
      }
    });
  }

  async garantirCarregado(): Promise<void> {
    const contaId = this.auth.sessao()?.user.id ?? null;

    if (!contaId) {
      this.limparMemoria();
      return;
    }
    if (this.contaCarregada === contaId) {
      return;
    }
    this.pedidoEmCurso ??= this.carregar(contaId).finally(() => (this.pedidoEmCurso = null));
    return this.pedidoEmCurso;
  }

  private async carregar(contaId: string): Promise<void> {
    this.lista.set([]);
    this.contaCarregada = null;

    const { data, error } = await this.supabase.cliente
      .from('aventureiros')
      .select(COLUNAS)
      .eq('conta_id', contaId)
      .order('id')
      .returns<LinhaAventureiro[]>();

    if (error) {
      console.error('Erro ao carregar aventureiros:', error.message);
      this.erroCarga.set('Não foi possível carregar os aventureiros. Verifica a ligação e tenta novamente.');
      return;
    }

    this.lista.set((data ?? []).map(paraUtilizador));
    this.contaCarregada = contaId;
    this.erroCarga.set(null);
  }

  obterTodos(): Utilizador[] {
    return this.lista();
  }

  obterPorId(id: number): Utilizador | undefined {
    return this.lista().find(u => u.id === id);
  }

  async criar(dados: NovoUtilizador): Promise<Utilizador> {
    const { data, error } = await this.supabase.cliente
      .from('aventureiros')
      .insert(paraLinha(dados))
      .select(COLUNAS)
      .returns<LinhaAventureiro[]>()
      .single();

    if (error || !data) {
      console.error('Erro ao criar aventureiro:', error?.message);
      throw new Error('Não foi possível criar o aventureiro. Tenta novamente.');
    }

    const novo = paraUtilizador(data);
    this.lista.update(lista => [...lista, novo]);
    return novo;
  }

  async atualizar(atualizado: Utilizador): Promise<Utilizador> {
    const { data, error } = await this.supabase.cliente
      .from('aventureiros')
      .update(paraLinha(atualizado))
      .eq('id', atualizado.id)
      .select(COLUNAS)
      .returns<LinhaAventureiro[]>()
      .single();

    if (error || !data) {
      console.error('Erro ao atualizar aventureiro:', error?.message);
      throw new Error('Não foi possível guardar as alterações. Tenta novamente.');
    }

    const guardado = paraUtilizador(data);
    this.lista.update(lista => lista.map(u => (u.id === guardado.id ? guardado : u)));
    return guardado;
  }

  async apagar(id: number): Promise<void> {
    const { data, error } = await this.supabase.cliente
      .from('aventureiros')
      .delete()
      .eq('id', id)
      .select('id');

    if (error || !data || data.length === 0) {
      console.error('Erro ao apagar aventureiro:', error?.message ?? 'nenhuma linha apagada');
      throw new Error('Não foi possível apagar o perfil. Tenta novamente.');
    }

    this.registoService.apagarDoUtilizador(id);
    this.jornadaService.apagarDoUtilizador(id);

    if (this.obterAtivo()?.id === id) {
      this.terminarSessao();
    }
    this.lista.update(lista => lista.filter(u => u.id !== id));
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

  private limparMemoria(): void {
    this.lista.set([]);
    this.contaCarregada = null;
    this.erroCarga.set(null);
  }
}

function paraUtilizador(linha: LinhaAventureiro): Utilizador {
  return {
    id: linha.id,
    nome: linha.nome,
    genero: linha.genero,
    avatar: linha.avatar,
    idade: linha.idade,
    peso: Number(linha.peso),
    altura: linha.altura,
    temKettlebell: linha.tem_kettlebell,
    nivelFisico: linha.nivel_fisico,
    diasDescansoSemana: linha.dias_descanso_semana,
    dataCriacao: linha.data_criacao,
  };
}

function paraLinha(dados: NovoUtilizador) {
  return {
    nome: dados.nome.trim(),
    genero: dados.genero,
    avatar: dados.avatar,
    idade: dados.idade,
    peso: dados.peso,
    altura: dados.altura,
    tem_kettlebell: dados.temKettlebell,
    nivel_fisico: dados.nivelFisico,
    dias_descanso_semana: dados.diasDescansoSemana,
  };
}