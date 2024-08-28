import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BuscadorService {

  constructor(private http:HttpClient) { }

  getRoutes (busqueda:string) {
    return this.http.get(`${environment.APIUrl}routes/get_routes/${busqueda}`);
  }  
}
