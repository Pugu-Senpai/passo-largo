import { NivelFisico, Zona, Intensidade, Equipamento } from './tipos';

export interface Exercicio {
  id: number;
  nome: string;
  tipo: 'forca' | 'cardio';
  zona: Zona;
  niveis: NivelFisico[];
  intensidade?: Intensidade;
  equipamento: Equipamento;
  musculos: string[];
  passos: string[];
  series: number;
  repeticoes?: number;
  duracaoSegundos?: number;
  video?: string;
}