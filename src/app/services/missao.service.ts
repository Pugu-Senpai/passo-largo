import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RegistoService } from './registo.service';
import { Missao, MissaoDaSemana, CriterioMissao, TamanhoMissao } from '../models/missao.model';
import { RegistoDia } from '../models/registo-dia.model';
import { hoje, inicioSemana, somarDias } from '../utils/datas';

interface LinhaMissao {
  id: number;
  titulo: string;
  descricao: string;
  personagem: string;
  tamanho: TamanhoMissao;
  criterio: CriterioMissao;
  meta: number;
  pontos: number;
}

interface LinhaConcluida {
  missao_id: number;
  semana_inicio: string;
  missoes: { titulo: string; personagem: string; tamanho: TamanhoMissao; pontos: number } | null;
}

/** Uma semana do histórico, com as missões concluídas nessa semana */
export interface SemanaHistorico {
  semana: string;
  pontos: number;
  missoes: { id: number; titulo: string; personagem: string; tamanho: TamanhoMissao; pontos: number }[];
}

@Injectable({ providedIn: 'root' })
export class MissaoService {
  private readonly supabase = inject(SupabaseService);
  private readonly registoService = inject(RegistoService);

  private readonly missoes = signal<Missao[]>([]);
  private readonly concluidas = signal<LinhaConcluida[]>([]);
  private chaveCarregada: string | null = null; // "aventureiro|semana"
  private pedidoEmCurso: Promise<void> | null = null;

  readonly pontosTotais = computed(() =>
    this.concluidas().reduce((total, c) => total + (c.missoes?.pontos ?? 0), 0)
  );

  readonly totalConcluidas = computed(() => this.concluidas().length);

  /** Missões concluídas agrupadas por semana, da mais recente para a mais antiga */
  readonly historico = computed<SemanaHistorico[]>(() => {
    const porSemana = new Map<string, SemanaHistorico>();
    for (const c of this.concluidas()) {
      if (!c.missoes) {
        continue;
      }
      const semana = porSemana.get(c.semana_inicio) ?? { semana: c.semana_inicio, pontos: 0, missoes: [] };
      semana.missoes.push({ id: c.missao_id, ...c.missoes });
      semana.pontos += c.missoes.pontos;
      porSemana.set(c.semana_inicio, semana);
    }
    return [...porSemana.values()].sort((a, b) => b.semana.localeCompare(a.semana));
  });

  constructor() {
    this.supabase.cliente.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        this.limparMemoria();
      }
    });
  }

  // ===== Carregamento =====

  async garantirCarregado(aventureiroId: number): Promise<void> {
    const chave = `${aventureiroId}|${this.semanaAtual()}`;
    if (this.chaveCarregada === chave) {
      return;
    }
    this.pedidoEmCurso ??= this.carregar(aventureiroId, chave).finally(() => (this.pedidoEmCurso = null));
    return this.pedidoEmCurso;
  }

  private async carregar(aventureiroId: number, chave: string): Promise<void> {
    this.limparMemoria();

    const [sorteio, conclusoes] = await Promise.all([
      this.supabase.cliente
        .rpc('missoes_da_semana', { p_aventureiro: aventureiroId }),
      this.supabase.cliente
        .from('missoes_concluidas')
        .select('missao_id, semana_inicio, missoes ( titulo, personagem, tamanho, pontos )')
        .eq('aventureiro_id', aventureiroId)
        .returns<LinhaConcluida[]>()
    ]);

    if (sorteio.error || conclusoes.error) {
      console.error('Erro ao carregar missões:', sorteio.error?.message ?? conclusoes.error?.message);
      throw new Error('Não foi possível carregar as missões. Tenta novamente.');
    }

    this.missoes.set(((sorteio.data ?? []) as LinhaMissao[]).map(paraMissao));
    this.concluidas.set(conclusoes.data ?? []);
    this.chaveCarregada = chave;
  }

  // ===== Leitura =====

  missoesDaSemana(aventureiroId: number): MissaoDaSemana[] {
    const semana = this.semanaAtual();
    const registos = this.registosDaSemana(aventureiroId, semana);
    const concluidasDaSemana = new Set(
      this.concluidas().filter(c => c.semana_inicio === semana).map(c => c.missao_id)
    );

    return this.missoes()
      .slice()
      .sort((a, b) => (a.tamanho === b.tamanho ? 0 : a.tamanho === 'grande' ? -1 : 1))
      .map(missao => {
        const progresso = calcularProgresso(missao.criterio, registos);
        return {
          missao,
          progresso,
          cumprida: progresso >= missao.meta,
          concluida: concluidasDaSemana.has(missao.id)
        };
      });
  }

  // ===== Escrita =====

  async receberPontos(aventureiroId: number, missaoId: number): Promise<void> {
    const { error } = await this.supabase.cliente
      .rpc('concluir_missao', { p_aventureiro: aventureiroId, p_missao: missaoId });

    if (error) {
      console.error('Erro ao concluir missão:', error.message);
      throw new Error('Não foi possível receber os pontos. Confirma que a missão está cumprida e tenta novamente.');
    }

    this.chaveCarregada = null;
    await this.garantirCarregado(aventureiroId);
  }

  // ===== Auxiliares =====

  semanaAtual(): string {
    return inicioSemana(hoje());
  }

  private registosDaSemana(aventureiroId: number, semana: string): RegistoDia[] {
    const domingo = somarDias(semana, 6);
    return this.registoService
      .obterDoUtilizador(aventureiroId)
      .filter(r => r.data >= semana && r.data <= domingo);
  }

  private limparMemoria(): void {
    this.missoes.set([]);
    this.concluidas.set([]);
    this.chaveCarregada = null;
  }
}

function calcularProgresso(criterio: CriterioMissao, registos: RegistoDia[]): number {
  const treinou = (r: RegistoDia) => r.minutosAtivos > 0;
  switch (criterio) {
    case 'dias-forca':
      return registos.filter(r => treinou(r) && r.tipoTreino === 'forca').length;
    case 'dias-cardio':
      return registos.filter(r => treinou(r) && r.tipoTreino === 'cardio').length;
    case 'dias-misto':
      return registos.filter(r => treinou(r) && r.tipoTreino === 'misto').length;
    case 'dias-completos':
      return registos.filter(r => r.estado === 'completo').length;
    case 'km':
      return Math.round(registos.reduce((total, r) => total + r.kmGanhos, 0) * 10) / 10;
    case 'exercicios':
      return registos.reduce((total, r) => total + r.exerciciosFeitos, 0);
  }
}

function paraMissao(linha: LinhaMissao): Missao {
  return {
    id: linha.id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    personagem: linha.personagem,
    tamanho: linha.tamanho,
    criterio: linha.criterio,
    meta: Number(linha.meta),
    pontos: linha.pontos,
  };
}