import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router'; 

@Injectable({
  providedIn: 'root'
})
export class NuevaRutaService {

  constructor(private http: HttpClient, private router: Router) { }

  upload (ruta: any, gpx: File) {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token'); // o sessionStorage.getItem('auth_token')

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return;
    }

    const formData = new FormData();
    formData.append('gpx', gpx); 
    formData.append('route', JSON.stringify(ruta));

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.post<FormData>(`${environment.APIUrl}routes/add_route`, formData, { headers })
      .subscribe(response => {
        console.log('Respuesta del servidor: ', response);
        this.router.navigate(['/myFeed']); // Navega a la página principal
      }, error => {
        console.error('Error en la solicitud: ', error)
      });
  }
}
