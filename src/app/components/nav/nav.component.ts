import { Component, Input, input, OnInit } from '@angular/core';
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

  constructor (private accesoService: AccesoService, private perfilService: PerfilService) {}

  ngOnInit(): void {
    // Suscribirse a los cambios de autenticación
    this.accesoService.getAuthStatus().subscribe((isAuthenticated) => {
      this.getCurrentUser();
    });
  }

  isAuthenticated () {
    return this.accesoService.isAuthenticated();
  }

  getCurrentUser () {
    return this.accesoService.getCurrentUser().subscribe(res => {
      this.idPerfil = res; 

      this.perfilService.getUser(this.idPerfil).subscribe(user => {
        if (user.photo) {
          this.photo = user.photo;
        }
        console.log(user.photo);
      })
    })
  }
  
}
