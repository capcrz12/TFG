import { Injectable } from '@angular/core';
import { Dictionary } from '../../dictionary';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class EditarRutaService {

  constructor(private http: HttpClient, private router: Router) { }

  // Se le pasa idPerfil para poder navegar al perfil una vez actualizada la ruta
  updateRoute (ruta: Dictionary, idPerfil: number) {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token');

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return;
    }

    console.log(ruta);

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.post<FormData>(`${environment.APIUrl}routes/update_route`, ruta, { headers })
      .subscribe(response => {
        this.router.navigate(['/perfil', idPerfil], { state: { message: 'Ruta actualizada con éxito' } }); // Navega a la página principal
      }, error => {
        console.error('Error en la solicitud: ', error)
        this.router.navigate(['/perfil', idPerfil], { state: { message: 'Ha ocurrido un error en la actualización' } }); // Navega a la página principal
      });
  }
}
