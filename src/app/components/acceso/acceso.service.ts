import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccesoService {

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false); // Inicia como no autenticado

  constructor(private http: HttpClient, private router: Router) {}

  login(usuario: { id: number, name: string, email: string, password: string }): Observable<string> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<{ access_token: string }>(`${environment.APIUrl}users/login`, usuario, { headers })
    .pipe(
      map(response => {
        localStorage.setItem('auth_token', response.access_token); // Guarda el token en el dispositivo local del usuario
        this.isAuthenticatedSubject.next(true); // Emitir que el usuario está autenticado
        this.router.navigate(['/myFeed']); // Navega a la página principal
        return '';
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.';
        if (error.status === 401) {
          errorMessage = 'Credenciales inválidas. Por favor, inténtalo de nuevo.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout() {
    localStorage.removeItem('auth_token'); // Elimina el token al cerrar sesión
    this.isAuthenticatedSubject.next(false); // Emitir que el usuario no está autenticado
    this.router.navigate(['/acceso']); // Redirige a la página de inicio de sesión
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  checkPassword (id: number, password: string): Observable<any> {
    const usuario = {id: id, password: password};
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.post(`${environment.APIUrl}users/check_password`, usuario, {headers})
  }

  getCurrentUser(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.get(`${environment.APIUrl}users/get_current_user`, {headers})
  }
  

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
  
    const decoded: any = jwtDecode(token);
    const expirationDate = decoded.exp * 1000;
    const currentDate = new Date().getTime();
  
    return expirationDate < currentDate;
  }

  getAuthStatus(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}