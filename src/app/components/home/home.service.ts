import { Injectable } from '@angular/core';
import { cargarGPX, getData, getStatistics } from '../../utils/map';
import { environment } from '../../../environments/environment';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Dictionary } from '../../dictionary'; 
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class HomeService {

  gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  dataMap:Dictionary[] = [];


  constructor(private http:HttpClient) { }

  getRoutes(): Observable<any> {
    return this.http.get(environment.APIUrl+"routes/get_routes");
  }

  getGPXData(routes:any): Promise<any> {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < routes.length; i++) {
        if (routes[i].gpx != '') {
          cargarGPX("./assets/" + routes[i].gpx).then((gpxData) => {
            resolve(gpxData);
          }).catch(error => {
            reject(error);
          });
        }
      }
    });
  }

  getDataMap(routes:any, gpxData:any): Dictionary[] {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].gpx != '') {
        this.gpxData = gpxData;
        // Llama a convertGPX con la ruta correcta del archivo GPX
        getData(this.gpxData, routes[i], i/*, this.dataMap*/);
        
        getStatistics(routes[i],this.dataMap, i);
      }
    }

    return this.dataMap;
  }

}
