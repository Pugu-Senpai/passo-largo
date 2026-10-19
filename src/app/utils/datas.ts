// Date num texto 'AAAA-MM-DD'
export function paraTextoData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Data de hoje
export function hoje(): string {
  return paraTextoData(new Date());
}

// Converte um texto 'AAAA-MM-DD'
export function paraData(texto: string): Date {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

// Soma
export function somarDias(texto: string, dias: number): string {
  const data = paraData(texto);
  data.setDate(data.getDate() + dias);
  return paraTextoData(data);
}

// Quantos dias vão de uma data até outra
export function diferencaDias(de: string, ate: string): number {
  const UM_DIA = 24 * 60 * 60 * 1000;
  return Math.round((paraData(ate).getTime() - paraData(de).getTime()) / UM_DIA);
}

// A segunda-feira da semana a que a data pertence
export function inicioSemana(texto: string): string {
  const diaDaSemana = (paraData(texto).getDay() + 6) % 7; // segunda = 0 ... domingo = 6
  return somarDias(texto, -diaDaSemana);
}