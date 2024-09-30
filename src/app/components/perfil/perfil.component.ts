import { Component, Input, OnInit } from '@angular/core';
import { AccesoService } from '../acceso/acceso.service';
import { PerfilService } from './perfil.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RutaService } from '../ruta/ruta.service';
import { forkJoin } from 'rxjs';
import { ModalSeguidoresComponent } from '../modal-seguidores/modal-seguidores.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterModule, ModalSeguidoresComponent],
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

    photoProfile: string = '../../assets/images/perfil.png';
    photoProfileTMP: string = '';
    selectedImage: File | null = null;

    botonSeguimiento: string = 'Seguir';
    siguiendo: boolean = false;

    error: string = '';
    success: string = '';

    followers: any[] = [];
    followeds: any[] = [];
    numFollowers: number = 0;
    numFolloweds: number = 0;

    modalOpen: boolean = false;
    modalFollowed: boolean = true;
    modalTitle: string = 'Seguidores';

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
        this.getFollowers();
        this.getFolloweds();
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

    openModalSeguidores() {
      this.modalFollowed = false;
      this.modalTitle = 'Seguidores';
      this.modalOpen = true;
    }
    
    openModalSeguidos() {
      this.modalFollowed = true;
      this.modalTitle = 'Siguiendo';
      this.modalOpen = true;
    }
    
  
    closeModal() {
      this.modalOpen = false;
    }

    checkIfFollowing() {
      // Verifica si tanto idPerfil como dataMap están disponibles
      if (this.idPerfil !== -1 && this.id !== -1) {
        this.perfilService.isFollowing(this.id, this.idPerfil).subscribe({
          next: (result: boolean) => {
            this.siguiendo = result;
            this.botonSeguimiento = this.siguiendo ? 'Dejar de seguir' : 'Seguir'; 
          },
          error: (error) => {
            console.error('Error al verificar si sigue al usuario:', error);
            this.siguiendo = false; // En caso de error, establece siguiendo en false
          }
        });
      }
      else {
        console.log('Datos no cargados aún');
      }
    }

    botonSeguir() {
      this.siguiendo = !this.siguiendo;
      this.botonSeguimiento = this.siguiendo ? 'Dejar de seguir' : 'Seguir';
  
      if (this.siguiendo) {
        this.follow();
      } else {
        this.unfollow();
      }
    }
  
    follow() {
      this.perfilService.follow(this.id, this.idPerfil).subscribe({
        next: () => {
          console.log('Has empezado a seguir al usuario.');
        },
        error: (error) => {
          console.error('Error al seguir al usuario:', error);
          // En caso de error, revertir el estado a no seguir
          this.siguiendo = false;
          this.botonSeguimiento = 'Seguir';
        }
      });
    }
  
    unfollow() {
      this.perfilService.unfollow(this.id, this.idPerfil).subscribe({
        next: () => {
          console.log('Has dejado de seguir al usuario.');
        },
        error: (error) => {
          console.error('Error al dejar de seguir al usuario:', error);
          // En caso de error, revertir el estado a seguir
          this.siguiendo = true;
          this.botonSeguimiento = 'Dejar de seguir';
        }
      });
    }

    modoEdicionPerfil () {
      if (this.propio) {
        this.edicion = !this.edicion;

        this.nameEdit = '';
        this.passwordEdit = '';
        this.photoProfileTMP = '';
        this.passwordChecked = false;
      }
    }

    getFolloweds () {
      this.perfilService.getFolloweds(this.idPerfil).subscribe((res:any) => {
        this.followeds = res;
        this.numFolloweds = this.followeds.length;
      });
    }

    getFollowers () {
      this.perfilService.getFollowers(this.idPerfil).subscribe((res:any) => {
        this.followers = res;
        this.numFollowers = this.followers.length;
      })
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
        if (res.photo) {
          this.photoProfile = res.photo;
        }

        this.checkIfFollowing();
      });
      
    }

    getRoutes () {
      this.perfilService.getRoutes(this.idPerfil).subscribe((res) => {
        this.routes = res;
        this.routes.forEach((route:any, index:number) => {
          this.rutaService.getRouteImages(route.id).subscribe({
            next: (images: any) => {
              this.routes[index]['photo'] = images[0].filename;
            },
            error: (error) => {
              this.routes[index]['photo'] = '';
              console.error('Error al cargar las imágenes:', error);
            }
          });
        })
      })
    }

    async editarPerfil () {
      let usuario = {id: this.id, name: this.name, email: '', password: ''};
      if (this.nameEdit != '') {
        usuario['name'] = this.nameEdit;
      }
      if (this.passwordChecked && this.passwordEdit != '') {
        usuario['password'] = this.passwordEdit;
      }

      await this.updatePhoto();

      this.perfilService.updatePerfil(usuario).subscribe((res) => {

        this.success = 'Datos actualizados correctamente';
        setTimeout(() => {
          this.success = '';
        }, 3000); 
        this.getInfo();
        this.modoEdicionPerfil();
      })
    }

    updatePhoto () {
      if (this.photoProfileTMP != '' || !this.selectedImage) {
        const formData = new FormData();
        formData.append('image', this.selectedImage!, this.selectedImage!.name);
        
        return this.perfilService.updatePhoto(this.idPerfil, formData);
      }
      else
        return ;
    }

    onImageSelected (event: any) {
      this.photoProfileTMP = URL.createObjectURL(event.target.files[0]);
      this.selectedImage = event.target.files[0];
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
