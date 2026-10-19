export interface ProgressoMissao {
  id: number;
  utilizadorId: number;
  missaoId: number;
  semanaInicio: string;
  progresso: number;
  concluida: boolean;
}