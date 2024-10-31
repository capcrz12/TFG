import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
  

@Injectable({
  providedIn: 'root'
})
export class BuscadorService {

  constructor(private http:HttpClient) { }

  getRoutes (busqueda:string) {
    return this.http.get(`${process.env['API_URL']}routes/get_routes/${busqueda}`);
  }  

  getUsers (busqueda:string) {
    return this.http.get(`${process.env['API_URL']}users/get_users/${busqueda}`);
  }  

}
