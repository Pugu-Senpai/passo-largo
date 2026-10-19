import { EstadoJornada } from './tipos';

export interface Jornada {
  id: number;
  utilizadorId: number;
  estado: EstadoJornada;
  kmPercorridos: number;
  ultimoMarcoId: number | null;
  numeroRecuos: number;
  dataInicio: string;
}