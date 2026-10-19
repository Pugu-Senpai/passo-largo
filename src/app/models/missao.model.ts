export interface Missao {
  id: number;
  titulo: string;
  descricao: string;
  personagem: string;
  tamanho: 'grande' | 'pequena';
  criterio: 'dias-forca' | 'dias-cardio' | 'minutos' | 'exercicios';
  meta: number;
  kmBonus?: number;
  colecionavelId?: number;
}