import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AccesoService } from '../components/acceso/acceso.service';

export const accesoGuard: CanActivateFn = (route, state) => {
  const accesoService = inject(AccesoService)
  if (accesoService.isAuthenticated()) {
    return true;
  }

  return false;
};
