import { Injectable } from '@angular/core';
import { cargarGPX, getData, getStatistics } from '../../utils/map';
 
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Dictionary } from '../../dictionary'; 
import { Observable } from 'rxjs';
import { RutaService } from '../ruta/ruta.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  dataMap:Dictionary[] = [];


  constructor(private http:HttpClient, private rutaService: RutaService) { }

  getRoutesSiguiendo(id: number): Observable<any> {
    return this.http.get(process.env['API_URL']+`routes/get_routes_followed/${id}`);
  }

  getRoutesExplorar(): Observable<any> {
    return this.http.get(process.env['API_URL']+"routes/get_routes_and_user");
  }

  /*
  // Se usaba para obtener el archivo .gpx del assets del front
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
  }*/

  getGPXData(routes: any): Promise<any> {
    return new Promise((resolve, reject) => {
        // Crear una promesa para cargar los archivos GPX
        const gpxPromises = routes.map((route: any) => {
            if (route.gpx !== '') {
                // Construir la URL completa para la solicitud
                const url = `${process.env['API_URL']}routes/get_gpx/${route.gpx}`;
                // Llamar a cargarGPX con la URL del backend
                return cargarGPX(url);
            }
            return Promise.resolve(null);
        });

        // Esperar a que todas las promesas se resuelvan
        Promise.all(gpxPromises).then((gpxDataArray) => {
            const gpxData = gpxDataArray.filter(data => data !== null);
            resolve(gpxData);
        }).catch(error => {
            reject(error);
        });
    });
  }
  
  

  getDataMap(routes:any, gpxData:any): Dictionary[] {
    this.dataMap = [];
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].gpx != '') {
        this.gpxData = gpxData;
        // Llama a convertGPX con la ruta correcta del archivo GPX
        //getData(this.gpxData, routes[i], i/*, this.dataMap*/);
        
        getStatistics(routes[i],this.dataMap, i);
        this.rutaService.getRouteImages(routes[i].id).subscribe({
          next: (images: any) => {
            this.dataMap[i]['photo'] = images[0].filename;
          },
          error: (error) => {
            this.dataMap[i]['photo'] = '';
            console.error('Error al cargar las imágenes:', error);
          }
        });
      }
    }

    return this.dataMap;
  }

}
