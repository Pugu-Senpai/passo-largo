export type TamanhoMissao = 'pequena' | 'grande';

export type CriterioMissao =
  | 'dias-forca'
  | 'dias-cardio'
  | 'dias-misto'
  | 'dias-completos'
  | 'km'
  | 'exercicios';

export interface Missao {
  id: number;
  titulo: string;
  descricao: string;
  personagem: string;
  tamanho: TamanhoMissao;
  criterio: CriterioMissao;
  meta: number;
  pontos: number;
}

export interface MissaoDaSemana {
  missao: Missao;
  progresso: number;
  cumprida: boolean;
  concluida: boolean;
}