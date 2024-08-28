import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AccesoService } from './acceso.service';

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './acceso.component.html',
  styleUrl: './acceso.component.css'
})
export class AccesoComponent {
  email: string;
  password: string;

  constructor (public accesoService: AccesoService) {
    this.email = '';
    this.password = '';
  }

  login() {
    const usuario = { email: this.email, password: this.password };

    this.accesoService.login(usuario).subscribe(
      (data) => {
        console.log('Login successful', data);
        this.accesoService.setToken(data.access_token);  // Guarda el token recibido
      },
      (error) => {
        console.error('Login failed', error);
      }
    );
  }

  getProtectedData() {
    this.accesoService.getProtectedData().subscribe(
      (data) => {
        console.log('Protected data', data);
      },
      (error) => {
        console.error('Failed to get protected data', error);
      }
    );
  }
}
