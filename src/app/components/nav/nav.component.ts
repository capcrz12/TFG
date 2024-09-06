import { Component, Input, input } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { BuscadorComponent } from '../buscador/buscador.component';
import { AccesoService } from '../acceso/acceso.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterOutlet, RouterLink, BuscadorComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent {
  @Input() title = '';

  constructor (private accesoService: AccesoService) {}

  isAuthenticated () {
    return this.accesoService.isAuthenticated();
  }

  logout () {
    this.accesoService.logout();
  }
}
