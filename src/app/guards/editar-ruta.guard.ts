import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RutaService } from '../components/ruta/ruta.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const editarRutaGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const routeId = route.params['id'];
  const rutaService = inject(RutaService);
  const router = inject(Router);  // Inyecta el servicio Router

  return rutaService.isAuthor(routeId).pipe(
    map(isAuthor => {
      if (isAuthor) {
        return true;
      } else {
        router.navigate(['/myFeed']);
        return false;
      }
    }),
    catchError(error => {
      console.error('Error verificando si es autor:', error);
      router.navigate(['/myFeed']);
      return of(false); // En caso de error, bloquea el acceso
    })
  );
};
