import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { editarRutaGuard } from './editar-ruta.guard';

describe('editarRutaGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => editarRutaGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
