import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AccesoService } from './components/acceso/acceso.service';
import { AccesoInterceptor } from './interceptors/acceso.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()), 
    provideClientHydration(),
    provideHttpClient(withFetch()),
    AccesoService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AccesoInterceptor,
      multi: true
    }
  ]
};
