import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AccesoService } from './acceso.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './acceso.component.html',
  styleUrl: './acceso.component.css'
})
export class AccesoComponent {
  email: string;
  password: string;

  showPassword: boolean = false;

  constructor (public accesoService: AccesoService) {
    this.email = '';
    this.password = '';
  }

  passwordFieldType() {
    return this.showPassword ? 'text' : 'password';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
