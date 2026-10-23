import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UtilizadorService } from '../services/utilizador.service';
import { JornadaService } from '../services/jornada.service';
import { RegistoService } from '../services/registo.service';

export const autenticadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const utilizadores = inject(UtilizadorService);
  const jornadas = inject(JornadaService);
  const registos = inject(RegistoService);

  if (!(await auth.estaAutenticado())) {
    return router.createUrlTree(['/entrar']);
  }

  await utilizadores.garantirCarregado();

  const ativo = utilizadores.obterAtivo();
  if (ativo) {
    await Promise.all([
      jornadas.garantirCarregado(ativo.id),
      registos.garantirCarregado(ativo.id),
    ]);
  }
  return true;
};

export const visitanteGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return (await auth.estaAutenticado())
    ? router.createUrlTree(['/'])
    : true;
};