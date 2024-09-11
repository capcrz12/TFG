import { Component, Input, input, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterModule } from '@angular/router';
import { BuscadorComponent } from '../buscador/buscador.component';
import { AccesoService } from '../acceso/acceso.service';

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

  constructor (private accesoService: AccesoService) {}

  ngOnInit(): void {
    this.getCurrentUser();
  }

  isAuthenticated () {
    return this.accesoService.isAuthenticated();
  }

  getCurrentUser () {
    return this.accesoService.getCurrentUser().subscribe(res => {
      this.idPerfil = res; 
    })
  }
}
