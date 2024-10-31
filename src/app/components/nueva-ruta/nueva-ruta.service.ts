import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NuevaRutaService {

  constructor(private http: HttpClient) {}

  upload(ruta: any, gpx: File): Observable<any> {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token'); // o sessionStorage.getItem('auth_token')

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return throwError(() => new Error('No se ha encontrado el token de autenticación'));
    }

    const formData = new FormData();
    formData.append('gpx', gpx); 
    formData.append('route', JSON.stringify(ruta));

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` }); // Angular establece automáticamente el multipart

    return this.http.post<any>(`${environment.APIUrl}routes/add_route`, formData, { headers }).pipe(
      catchError((error) => {
        console.error('Error en la solicitud: ', error);
        return throwError(() => new Error('Error en la solicitud: ' + error.message));
      })
    );
  }

  uploadImages(routeId: number, images: FormData): Promise<any> {
    const token = localStorage.getItem('auth_token'); // o sessionStorage.getItem('auth_token')
  
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return throwError(() => new Error('No se ha encontrado el token de autenticación')).toPromise();
    }
  
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  
    return this.http.post(`${environment.APIUrl}routes/upload_images/${routeId}`, images, { headers }).toPromise();
  }
}
