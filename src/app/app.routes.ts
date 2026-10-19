import { Routes } from '@angular/router';
import { SelecaoPerfil } from './pages/selecao-perfil/selecao-perfil';
import { NovoPerfil } from './pages/novo-perfil/novo-perfil';
import { Condado } from './pages/condado/condado';
import { Jornada } from './pages/jornada/jornada';
import { Exercicios } from './pages/exercicios/exercicios';
import { ExercicioDetalhe } from './pages/exercicio-detalhe/exercicio-detalhe';
import { Perfil } from './pages/perfil/perfil';
import { Calendario } from './pages/calendario/calendario';

export const routes: Routes = [
  { path: '', component: SelecaoPerfil },
  { path: 'novo-perfil', component: NovoPerfil },
  { path: 'condado', component: Condado },
  { path: 'jornada', component: Jornada },
  { path: 'exercicios', component: Exercicios },
  { path: 'exercicios/:id', component: ExercicioDetalhe },
  { path: 'perfil', component: Perfil },
  { path: 'calendario', component: Calendario },
  { path: '**', redirectTo: '' }
];