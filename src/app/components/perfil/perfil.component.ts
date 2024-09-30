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

    /**
     * 
     * Función para inicializar el componente
     * 
     * - Suscribirse a los cambios de autenticación
     * - Obtener el perfil del usuario actual
     * - Obtener la información del perfil
     * - Obtener las rutas del perfil
     * - Obtener los seguidores del perfil
     * - Obtener los seguidos del perfil
     * 
     */
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

    /**
     * 
     * Función para cerrar la sesión
     * 
     */
    logout () {
      this.accesoService.logout();
    }

    /**
     * 
     * Función para comprobar si el usuario es propio de la página
     *
     */
    isMyPerfil () {
      this.propio = this.checkID() && this.accesoService.isAuthenticated();
    }

    /**
     * 
     * Función para comprobar si el ID del perfil es el mismo que el ID del usuario
     * 
     * @returns boolean
     *  
     */
    checkID() {
      return this.id == this.idPerfil;
    }

    /**
     * 
     * Función para comprobar si la contraseña es correcta
     * 
     */
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

    /**
     * 
     * Función para abrir el modal de seguidores
     * 
     */
    openModalSeguidores() {
      this.modalFollowed = false;
      this.modalTitle = 'Seguidores';
      this.modalOpen = true;
    }
    
    /**
     * 
     * Función para abrir el modal de siguiendo
     * 
     */
    openModalSeguidos() {
      this.modalFollowed = true;
      this.modalTitle = 'Siguiendo';
      this.modalOpen = true;
    }
    
    /**
     * 
     * Función para cerrar el modal
     *  
     */
    closeModal() {
      this.modalOpen = false;
    }

    /**
     * 
     * Función para comprobar si el usuario está siguiendo al perfil
     * 
     */
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

    /**
     * 
     * Función para cambiar el estado de siguiendo
     * 
     */
    botonSeguir() {
      this.siguiendo = !this.siguiendo;
      this.botonSeguimiento = this.siguiendo ? 'Dejar de seguir' : 'Seguir';
  
      if (this.siguiendo) {
        this.follow();
      } else {
        this.unfollow();
      }
    }
  
    /**
     * 
     * Función para seguir al perfil
     * 
     */
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
  
    /**
     * 
     * Función para dejar de seguir al perfil
     * 
     */
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

    /**
     * 
     * Función para activar o desactivar el modo de edición del perfil
     *  
     */
    modoEdicionPerfil () {
      if (this.propio) {
        this.edicion = !this.edicion;

        this.nameEdit = '';
        this.passwordEdit = '';
        this.photoProfileTMP = '';
        this.passwordChecked = false;
      }
    }

    /**
     * 
     * Función para obtener los seguidos del perfil
     *  
     */
    getFolloweds () {
      this.perfilService.getFolloweds(this.idPerfil).subscribe((res:any) => {
        this.followeds = res;
        this.numFolloweds = this.followeds.length;
      });
    }

    /**
     * 
     * Función para obtener los seguidores del perfil
     *  
     */
    getFollowers () {
      this.perfilService.getFollowers(this.idPerfil).subscribe((res:any) => {
        this.followers = res;
        this.numFollowers = this.followers.length;
      })
    }
    
    /**
     * 
     * Función para obtener el perfil del usuario actual
     *  
     */
    getCurrentUser () {
      this.perfilService.getCurrentUser().subscribe((res) => {
        this.id = res;
        this.isMyPerfil();
      });
    }

    /**
     * 
     * Función para obtener la información del perfil
     *  
     */
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

    /**
     * 
     * Función para obtener las rutas del perfil
     *  
     */
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

    /**
     * 
     * Función para actualizar el perfil
     * 
     */
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

    /**
     * 
     * Función para actualizar la foto del perfil
     * 
     */
    updatePhoto () {
      if (this.photoProfileTMP != '' || !this.selectedImage) {
        const formData = new FormData();
        formData.append('image', this.selectedImage!, this.selectedImage!.name);
        
        return this.perfilService.updatePhoto(this.idPerfil, formData);
      }
      else
        return ;
    }

    /**
     * 
     * Función para mostrar la foto del perfil seleccionada
     * 
     * @param event Evento de selección de archivo
     *  
     */
    onImageSelected (event: any) {
      this.photoProfileTMP = URL.createObjectURL(event.target.files[0]);
      this.selectedImage = event.target.files[0];
    }

    /**
     * 
     * Función para eliminar una ruta
     * 
     * @param id ID de la ruta
     *  
     */
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
