import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { cargarGPXObservable, getData } from '../utils/map';
import { Dictionary } from '../dictionary';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  constructor(private http: HttpClient) { }

  getData(id: string): Observable<any> {
    return this.http.get(`${environment.APIUrl}get_route/${id}`).pipe(
      switchMap((routeJSON: any) => {
        if (routeJSON.gpx !== '') {
          return cargarGPXObservable(`./assets/${routeJSON.gpx}`).pipe(
            map(gpxData => {
              let data: Dictionary[] = [];
              getData(gpxData, routeJSON, 0, data);
              return { routeJSON, gpxData, dataMap: data[0] };
            }),
            catchError(error => {
              console.error('Error:', error);
              return of({ routeJSON, gpxData: null, dataMap: {} });
            })
          );
        } else {
          return of({ routeJSON, gpxData: null, dataMap: {} });
        }
      }),
      catchError(error => {
        console.error('Error:', error);
        return of({ routeJSON: null, gpxData: null, dataMap: {} });
      })
    );
  }
}
