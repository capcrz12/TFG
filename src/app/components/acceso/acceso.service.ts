import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class AccesoService {
  private token: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(usuario: { email: string, password: string }) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<{ access_token: string }>(`${environment.APIUrl}users/login`, usuario, { headers })
            .subscribe(response => {
              localStorage.setItem('auth_token', response.access_token); // Guarda el token en el dispositivo local del usuario
              this.router.navigate(['/myFeed']); // Navega a la página principal
            });
  }

  logout() {
    localStorage.removeItem('auth_token'); // Elimina el token al cerrar sesión
    this.router.navigate(['/myFeed']); // Redirige a la página de inicio de sesión
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}