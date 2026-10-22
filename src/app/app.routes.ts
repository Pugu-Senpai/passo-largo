import { Routes } from '@angular/router';
import { SelecaoPerfil } from './pages/selecao-perfil/selecao-perfil';
import { NovoPerfil } from './pages/novo-perfil/novo-perfil';
import { Condado } from './pages/condado/condado';
import { Jornada } from './pages/jornada/jornada';
import { Exercicios } from './pages/exercicios/exercicios';
import { ExercicioDetalhe } from './pages/exercicio-detalhe/exercicio-detalhe';
import { Perfil } from './pages/perfil/perfil';
import { Calendario } from './pages/calendario/calendario';
import { Definicoes } from './pages/definicoes/definicoes';

export const routes: Routes = [
  { path: '', component: SelecaoPerfil, title: 'Quem vem lá?' },
  { path: 'novo-perfil', component: NovoPerfil, title: 'Novo aventureiro' },
  { path: 'condado', component: Condado, title: 'Condado' },
  { path: 'jornada', component: Jornada, title: 'Jornada de hoje' },
  { path: 'exercicios', component: Exercicios, title: 'Exercícios' },
  { path: 'exercicios/:id', component: ExercicioDetalhe, title: 'Exercício' },
  { path: 'perfil', component: Perfil, title: 'Perfil' },
  { path: 'calendario', component: Calendario, title: 'Calendário' },
  { path: 'definicoes', component: Definicoes, title: 'Definições' },
  { path: '**', redirectTo: '' }
];