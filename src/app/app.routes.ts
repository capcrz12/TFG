import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RutaComponent } from './ruta/ruta.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AccesoComponent } from './acceso/acceso.component';
import { RegistroComponent } from './registro/registro.component';
import { TerminosComponent } from './terminos/terminos.component';

export const routes: Routes = [
    {
      path: 'myFeed',
      component: HomeComponent
    },
    {
      path: 'ruta/:id',
      component: RutaComponent
    },
    {
      path: '',
      redirectTo: '/myFeed',
      pathMatch: 'full'
    },
    {
      path: 'acceso',
      component: AccesoComponent
    },
    {
      path: 'registro',
      component: RegistroComponent
    },
    {
      path: 'privacy-policy',
      component: TerminosComponent
    },
    {
      path: 'terms-of-service',
      component: TerminosComponent
    },
    {
      path: 'data-usage',
      component: TerminosComponent
    },
    {
        path: '**',
        component: PageNotFoundComponent
    }
];
