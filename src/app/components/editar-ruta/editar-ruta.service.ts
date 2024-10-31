import { Injectable } from '@angular/core';
import { Dictionary } from '../../dictionary';
import { HttpClient, HttpHeaders } from '@angular/common/http';
 
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditarRutaService {

  constructor(private http: HttpClient, private router: Router) { }

  // Se le pasa idPerfil para poder navegar al perfil una vez actualizada la ruta
  updateRoute (ruta: Dictionary, idPerfil: number): Observable<any> {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token');

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return throwError(() => new Error('No se ha encontrado el token de autenticación'));
    }

    console.log(ruta);

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.post<FormData>(`${process.env['API_URL']}routes/update_route`, ruta, { headers });
  }

  deleteImage (image: string, id: number): Observable<any> {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token');

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
    }

    const body = { id: id, image: image };

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.post(`${process.env['API_URL']}routes/delete_route_image`, body, { headers });
  }
}
