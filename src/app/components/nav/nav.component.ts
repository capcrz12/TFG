import { Component, Input, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterModule } from '@angular/router';
import { BuscadorComponent } from '../buscador/buscador.component';
import { AccesoService } from '../acceso/acceso.service';
import { PerfilService } from '../perfil/perfil.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterModule, BuscadorComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit {
  @Input() title = '';
  idPerfil: number = -1;
  photo: string = '../../assets/images/perfil.png';
  isMenuOpen: boolean = false;

  constructor (private accesoService: AccesoService, private perfilService: PerfilService) {}

  /**
   * 
   * Función para inicializar el componente
   * 
   * - Suscribirse a los cambios de autenticación
   * - Obtener el perfil del usuario actual
   * 
   */
  ngOnInit(): void {
    // Suscribirse a los cambios de autenticación
    this.accesoService.isLoggedIn$.subscribe((status: boolean) => {
      if (status) {
        this.getCurrentUser();
      } else {
        // Si el usuario no está autenticado, resetear los valores
        this.idPerfil = -1;
        this.photo = '../../assets/images/perfil.png';
      }
    });
  }

  /**
   * 
   * Función para el menú responsive
   * 
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  
  /**
   * 
   * Función para comprobar si el usuario está autenticado
   * 
   * @returns boolean
   *  
   */
  isAuthenticated () {
    return this.accesoService.isAuthenticated();
  }

  /**
   * 
   * Función para obtener el perfil del usuario actual
   * 
   */
  getCurrentUser () {
    return this.accesoService.getCurrentUser().subscribe(res => {
      this.idPerfil = res; 

      this.perfilService.getUser(this.idPerfil).subscribe(user => {
        if (user.photo) {
          this.photo = user.photo;
        }
      })
    })
  }
  
}
