import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { cargarGPXObservable, getData, getStatistics } from '../../utils/map';
import { Dictionary } from '../../dictionary';
import { AccesoService } from '../acceso/acceso.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  constructor(private http: HttpClient, private accesoService: AccesoService, private router: Router) { }

  getData(id: string): Observable<any> {
    return this.http.get(`${process.env['API_URL']}routes/get_route/${id}`).pipe(
      switchMap((routeJSON: any) => {
        if (routeJSON.gpx !== '') {
          const url = `${process.env['API_URL']}routes/get_gpx/${routeJSON.gpx}`;
          return cargarGPXObservable(url).pipe(
            map(gpxData => {
              let dataMap: Dictionary = {};
              let data: Dictionary[] = [];
              getData(gpxData, routeJSON, 0/*, data*/);
              getStatistics(routeJSON, data, 0);
              dataMap = data[0];
              return { routeJSON, gpxData, dataMap };
            }),
            catchError(error => {
              console.error('Error:', error);
              return of({ routeJSON, gpxData: null, dataMap: {}});
            })
          );
        } else {
          return of({ routeJSON, gpxData: null, dataMap: {}});
        }
      }),
      catchError(error => {
        console.error('Error:', error);
        return of({ routeJSON: null, gpxData: null, dataMap: {}});
      })
    );
  }

  getRouteImages(id: string): Observable<any> {

    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token');

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart

    return this.http.get<any>(`${process.env['API_URL']}routes/get_route_images/${id}`, { headers });
  }
  
  isAuthor(id: number): Observable<boolean> {
    return this.accesoService.getCurrentUser().pipe(
      switchMap(author => {
        return this.getData(String(id)).pipe(
          map(res => {
            console.log(res.dataMap['user']['id'], author);
            return res.dataMap['user']['id'] == Number(author);
          })
        );
      }),
      catchError((error) => {
        console.error('Error:', error);
        return of(false);
      })
    );
  }
  

  deleteRoute(id: number, idPerfil: number): Observable<any> {
    // Recuperar el token almacenado en localStorage
    const token = localStorage.getItem('auth_token');

    // Asegurarse de que existe el token
    if (!token) {
      console.error('No se ha encontrado el token de autenticación');
    }

    const body = { id };

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`}); // Angular establece automáticamente el multipart
    return this.http.post(`${process.env['API_URL']}routes/delete_route`, body, { headers });
  }
  
  confirmDeleteRoute(): Observable<boolean> {
    // Crear un Observable que emitirá un valor según la confirmación del usuario
    return new Observable(observer => {
      const confirmed = window.confirm('¿Estás seguro de que deseas eliminar esta ruta? Esta acción no se puede deshacer.');

      if(confirmed) {          observer.next(true);
          observer.complete();
      }
      else {
          // Si el usuario cancela, emitimos `false` y completamos el observable
          observer.next(false);
          observer.complete();
      }
    });
  }
}
