import { NivelFisico, Genero } from './tipos';

export interface Utilizador {
  id: number;
  nome: string;
  genero: Genero;
  avatar: string;
  idade: number;
  peso: number;
  altura: number;
  temKettlebell: boolean;
  nivelFisico: NivelFisico;
  diasDescansoSemana: 1 | 2;
  dataCriacao: string;
}