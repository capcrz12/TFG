import { Component, Input, OnInit } from '@angular/core';
import { AccesoService } from '../acceso/acceso.service';
import { PerfilService } from './perfil.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RutaService } from '../ruta/ruta.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit{
    id: number;    
    name: string;
    email: string;
    total_km: number;
    propio: boolean;
    edicion: boolean;
    routes: any = [];

    nameEdit: string;
    passwordEdit: string;
    passwordChecked: boolean;

    error: string = '';
    success: string = '';

    @Input() idPerfil: number = -1;

    constructor (private perfilService: PerfilService, private rutaService: RutaService, private accesoService: AccesoService, private route: ActivatedRoute) {
      this.id = -1;
      this.name = 'Usuario';
      this.email = '';
      this.total_km = -1;
      this.propio = true;
      this.edicion = false;

      this.nameEdit = '';
      this.passwordEdit = '';
      this.passwordChecked = false;

      for (let i = 0; i < 5; i++) {
        this.routes!.push(`Ruta de las montañas gélidas del norte de los Pirineos Españoles${i}`);
      }
    }

    ngOnInit(): void {
      this.route.params.subscribe(params => {
        this.idPerfil = +params['idPerfil']; 

        this.getCurrentUser();
        this.getInfo ();
        this.getRoutes();
      });
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

    checkPassword () {
      this.accesoService.checkPassword(this.id, this.passwordEdit).subscribe((res) => {
        this.passwordChecked = res;
        
        if (!this.passwordChecked) {
          this.error = 'Contraseña incorrecta';
        }
        else {
          this.error = '';
          this.passwordEdit = '';
        }
      })
    }

    modoEdicionPerfil () {
      if (this.propio) {
        this.edicion = !this.edicion;

        this.nameEdit = '';
        this.passwordEdit = '';
        this.passwordChecked = false;
      }
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

    editarPerfil () {
      let usuario = {id: this.id, name: this.name, email: '', password: ''};
      if (this.nameEdit != '') {
        usuario['name'] = this.nameEdit;
      }
      if (this.passwordChecked && this.passwordEdit != '') {
        usuario['password'] = this.passwordEdit;
      }

      this.perfilService.updatePerfil(usuario).subscribe((res) => {
        this.success = 'Datos actualizados correctamente';
        setTimeout(() => {
          this.success = '';
        }, 3000); 
        this.getInfo();
        this.modoEdicionPerfil();
      })
    }

    eliminarRuta (id: number) {
      this.rutaService.confirmDeleteRoute().subscribe(confirmed => {
        if (confirmed) {
          this.rutaService.deleteRoute(id, this.idPerfil).subscribe(res => {
            this.getCurrentUser();
            this.getInfo ();
            this.getRoutes();
          }, error => {
          // Manejar el error en la eliminación
          console.error('Error en la solicitud: ', error);
          });
        } else {
          console.log('El usuario canceló la eliminación.');
        }
      });
    }
}
