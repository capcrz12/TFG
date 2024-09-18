import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { cargarGPXObservable, getData, getStatistics } from '../../utils/map';
import { Dictionary } from '../../dictionary';

@Injectable({
  providedIn: 'root'
})
export class RutaService {
  constructor(private http: HttpClient) { }

  getData(id: string): Observable<any> {
    return this.http.get(`${environment.APIUrl}routes/get_route/${id}`).pipe(
      switchMap((routeJSON: any) => {
        if (routeJSON.gpx !== '') {
          const url = `${environment.APIUrl}routes/get_gpx/${routeJSON.gpx}`;
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

  getRouteImages(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.APIUrl}routes/get_route_images/${id}`);
  }
}
