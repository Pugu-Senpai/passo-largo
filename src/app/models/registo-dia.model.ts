import { EstadoDia, TipoTreino } from './tipos';

export interface RegistoDia {
  id: number;
  utilizadorId: number;
  jornadaId: number;
  data: string;
  estado: EstadoDia;
  tipoTreino?: TipoTreino;
  minutosAtivos: number;
  exerciciosFeitos: number;
  kmGanhos: number;
  kmReais?: number;
}