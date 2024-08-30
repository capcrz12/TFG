import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RegistroService } from './registro.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  email: string;
  password: string;
  repPassword: string;
  errorMessage: string = '';
  successMessage: string = '';

  showPassword: boolean = false;
  showRepPassword: boolean = false;

  constructor (public registroService: RegistroService) {
    this.email = '';
    this.password = '';
    this.repPassword = '';
  }

  passwordFieldType() {
    return this.showPassword ? 'text' : 'password';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleRepPasswordVisibility() {
    this.showRepPassword = !this.showRepPassword;
  }

  register () {
    if (this.password !== this.repPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    else {
      this.errorMessage = '';
      // Si las contraseñas coinciden, proceder con el registro
      const usuario = { email: this.email, password: this.password };
      this.registroService.register(usuario).subscribe(
        (response) => {
          this.successMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
          this.errorMessage = '';
          this.clearForm();
        },
        (error) => {
          console.error('Error en el registro', error);
          this.errorMessage = 'Hubo un problema con el registro.';
          this.successMessage = '';
        }
      );
    }
  }

  clearForm() {
    this.email = '';
    this.password = '';
    this.repPassword = '';
  }
}
