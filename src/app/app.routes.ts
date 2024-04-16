import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RutaComponent } from './ruta/ruta.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
    {
      path: 'myFeed',
      component: HomeComponent
    },
    {
      path: 'ruta',
      component: RutaComponent
    },
    {
        path: '',
        redirectTo: '/myFeed',
        pathMatch: 'full'
    },
    {
        path: '**',
        component: PageNotFoundComponent
    }
];
