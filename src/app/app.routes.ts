import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RutaComponent } from './components/ruta/ruta.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccesoComponent } from './components/acceso/acceso.component';
import { RegistroComponent } from './components/registro/registro.component';
import { TerminosComponent } from './components/terminos/terminos.component';
import { accesoGuard } from './guards/acceso.guard';
import { NuevaRutaComponent } from './components/nueva-ruta/nueva-ruta.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { EditarRutaComponent } from './components/editar-ruta/editar-ruta.component';
import { editarRutaGuard } from './guards/editar-ruta.guard';
import { notAccesoGuard } from './guards/not-acceso.guard';

export const routes: Routes = [
    {
      path: 'myFeed',
      component: HomeComponent
    },
    {
      path: 'ruta/:id',
      component: RutaComponent,
      //canActivate: [accesoGuard]
    },
    {
      path: '',
      redirectTo: '/myFeed',
      pathMatch: 'full'
    },
    {
      path: 'perfil/:idPerfil',
      component: PerfilComponent,
      canActivate: [accesoGuard]
    },
    {
      path: 'nuevaRuta',
      component: NuevaRutaComponent,
      canActivate: [accesoGuard]
    },
    {
      path: 'perfil/:idPerfil/editarRuta/:id',
      component: EditarRutaComponent,
      canActivate: [accesoGuard, editarRutaGuard]
    },
    {
      path: 'acceso',
      component: AccesoComponent,
      canActivate: [notAccesoGuard]
    },
    {
      path: 'registro',
      component: RegistroComponent,
      canActivate: [notAccesoGuard]
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
