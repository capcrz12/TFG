import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  constructor(private http: HttpClient) { }

  private getToken () {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token'); // o sessionStorage.getItem('auth_token')

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return;
    }

    return token;
  }

  getCurrentUser(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.get(`${environment.APIUrl}users/get_current_user`, {headers})
  }

  getUser(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart

    return this.http.get(`${environment.APIUrl}users/get_user_by_id/${id}`, { headers });
  }

  getRoutes(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart

    return this.http.get(`${environment.APIUrl}routes/get_routes_by_author/${id}`, { headers });
  }

  updatePerfil(usuario: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart

    return this.http.post(`${environment.APIUrl}users/update_profile`,usuario, { headers });
  }
}