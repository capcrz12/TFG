import { Component, Input, OnInit } from '@angular/core';
import { AccesoService } from '../acceso/acceso.service';
import { PerfilService } from './perfil.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit{
    id: number;    
    name: string;
    email: string;
    total_km: number;
    propio: boolean;
    routes: any = [];

    @Input() idPerfil: number = -1;

    constructor (private perfilService: PerfilService, private accesoService: AccesoService) {
      this.id = -1;
      this.name = 'Usuario';
      this.email = '';
      this.total_km = -1;
      this.propio = true;
      for (let i = 0; i < 5; i++) {
        this.routes!.push(`Ruta de las montañas gélidas del norte de los Pirineos Españoles${i}`);
      }
    }

    ngOnInit(): void {
      this.getCurrentUser();
      this.getInfo ();
      this.getRoutes();
    }

    logout () {
      this.accesoService.logout();
    }

    isMyPerfil () {
      this.propio = this.checkID() && this.accesoService.isAuthenticated();
    }

    checkID() {
      return this.id == this.idPerfil;
    }

    getCurrentUser () {
      this.perfilService.getCurrentUser().subscribe((res) => {
        this.id = res;
        this.isMyPerfil();
      });
    }

    getInfo () {
      this.perfilService.getUser(this.idPerfil).subscribe((res) => {
        this.email = res.email;
        this.name = res.nombre;
        this.total_km = res.total_km;
      });
    }

    getRoutes () {
      this.perfilService.getRoutes(this.idPerfil).subscribe((res) => {
        this.routes = res;
      })
    }
}
