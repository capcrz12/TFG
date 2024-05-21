import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RutaComponent } from './ruta/ruta.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
    {
      path: 'myFeed/siguiendo',
      component: HomeComponent
    },
    {
      path: 'ruta/:id',
      component: RutaComponent
    },
    {
      path: 'myFeed',
      redirectTo: '/myFeed/siguiendo',
      pathMatch: 'full'
    },
    {
        path: '',
        redirectTo: '/myFeed/siguiendo',
        pathMatch: 'full'
    },
    {
        path: '**',
        component: PageNotFoundComponent
    }
];
