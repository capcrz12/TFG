import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RegistroService } from './registro.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterOutlet, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  name: string;
  email: string;
  password: string;
  repPassword: string;
  errorMessage: string = '';
  successMessage: string = '';
  acceptedTerms: boolean;  // Checkbox de términos
  verifiying: boolean;
  error: boolean;

  showPassword: boolean = false;
  showRepPassword: boolean = false;

  constructor (public registroService: RegistroService) {
    this.name = '';
    this.email = '';
    this.password = '';
    this.repPassword = '';
    this.acceptedTerms = false;  // Inicialización del checkbox
    this.verifiying = false;
    this.error = false;
  }

  /**
   * 
   * Función para obtener el tipo de campo de la contraseña
   * 
   * @returns string
   * 
   */
  passwordFieldType() {
    return this.showPassword ? 'text' : 'password';
  }

  /**
   * 
   * Función para obtener el tipo de campo de la contraseña
   * 
   * @returns string
   * 
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * 
   * Función para obtener el tipo de campo de la contraseña de repetición
   * 
   * @returns string
   * 
   */
  toggleRepPasswordVisibility() {
    this.showRepPassword = !this.showRepPassword;
  }

  /**
   * 
   * Función de registro de usuario
   *
   * - Verificar que se acepten los términos y condiciones
   * - Verificar que la contraseña y la contraseña de repetición coincidan
   * - Enviar el registro a la API
   * 
   */
  register () {
    if (!this.acceptedTerms) {
      this.errorMessage = 'Debes aceptar los términos y condiciones para registrarte.';
      this.error = true;
      return;
    }
    else if (this.password !== this.repPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.error = true;
      return;
    }
    else if (this.name == '' || this.email == '' || this.password == '' || this.repPassword == '') {
      this.errorMessage = 'Complete todos los campos por favor.';
      this.error = true;
      return;
    }
    else {
      this.errorMessage = '';
      this.successMessage = 'Procesando...';
      this.error = false;
      // Si las contraseñas coinciden, proceder con el registro
      const usuario = { id: -1, name: this.name, email: this.email, password: this.password };
      this.registroService.register(usuario).subscribe(
        (response) => {
          this.verifiying = true;
          this.successMessage = 'Compruebe su correo y verifique el registro para iniciar sesión';
          this.errorMessage = '';
          this.clearForm();
        },
        (error) => {
          console.error('Error en el registro', error);
          this.errorMessage = error.error['detail'];
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
