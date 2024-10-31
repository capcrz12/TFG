import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { map, Observable, switchMap, throwError } from 'rxjs';


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
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 
    return this.http.get(`${environment.APIUrl}users/get_current_user`, {headers})
  }

  getUser(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    return this.http.get(`${environment.APIUrl}users/get_user_by_id/${id}`, { headers });
  }

  getRoutes(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    return this.http.get(`${environment.APIUrl}routes/get_routes_by_author/${id}`, { headers });
  }

  updatePerfil(usuario: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    return this.http.post(`${environment.APIUrl}users/update_profile`,usuario, { headers });
  }

  updatePhoto(id:number, image:FormData): Promise<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
      return throwError(() => new Error('No se ha encontrado el token de autenticación')).toPromise();
    }

    return this.http.post(`${environment.APIUrl}users/update_profile_photo/${id}`,image, { headers }).toPromise();
  }

  follow(id_follower: number, id_followed: number):Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    const body = {id_follower: id_follower, id_followed: id_followed};

    return this.http.post(`${environment.APIUrl}users/follow`,body, { headers });
  }

  unfollow(id_follower: number, id_followed: number):Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    const body = {id_follower: id_follower, id_followed: id_followed};

    return this.http.post(`${environment.APIUrl}users/unfollow`,body, { headers });
  }

  getFolloweds(id_follower: number) {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    return this.http.get(`${environment.APIUrl}users/get_followeds/${id_follower}`, { headers });
  }

  getFollowers(id_followed: number) {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); 

    return this.http.get(`${environment.APIUrl}users/get_followers/${id_followed}`, { headers });
  }

  isFollowing(id_follower: number, id_followed: number):Observable<boolean> {

    return this.getFolloweds(id_follower).pipe(
      map((data: any) => {
        const found = data.find((item: any) => item.id_usuario_seguido === id_followed);

        return !!found; // True si se encuetra, false si no
      })
    );
  };
}