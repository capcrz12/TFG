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
  error: string = '';

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
    const usuario = { name: '', email: this.email, password: this.password };

    this.accesoService.login(usuario).subscribe({
      error: (error: Error) => {
        this.error = error.message;
      }
    });
  }
}
