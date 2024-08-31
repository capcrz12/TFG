import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RutaComponent } from './components/ruta/ruta.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccesoComponent } from './components/acceso/acceso.component';
import { RegistroComponent } from './components/registro/registro.component';
import { TerminosComponent } from './components/terminos/terminos.component';

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
