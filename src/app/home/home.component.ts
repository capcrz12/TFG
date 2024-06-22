import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Dictionary } from '../dictionary'; 
import { cargarGPX, getData } from '../utils/map';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapComponent, RouterLink, RouterModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  name: string;
  user: string;
  siguiendo: boolean;
  routes:any = [];
 
  type:number;
  gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  coordinates: any;
  bounds: any;
  dataMap:Dictionary[] = [];

  constructor(private http:HttpClient) {
    this.name = 'Ruta de prueba'
    this.user = 'Carlos Pérez'
    this.siguiendo = true;

    this.type = 0;   
  }

  ngOnInit(): void{
    this.getRoutes();
  }

  ngAfterViewInit() {

  }

  // Funcion que scrollea a la parte superior de la pantalla
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  setSiguiendo(value: boolean): void {
    this.siguiendo = value;
  }

  getRoutes() {
    this.http.get(environment.APIUrl+"get_routes").subscribe((res) => {
      this.routes = res;

      for (let i = 0; i < this.routes.length; i++) {
        if (this.routes[i].gpx != '' && this.type == 0) {
          cargarGPX("./assets/" + this.routes[i].gpx).then((gpxData) => {
            this.gpxData = gpxData;
            // Llama a convertGPX con la ruta correcta del archivo GPX
            getData(this.gpxData, this.routes[i], i, this.dataMap);
          }).catch(error => {
            console.error('Error:', error);
          });
        }
      }
    })
  }


  
}
