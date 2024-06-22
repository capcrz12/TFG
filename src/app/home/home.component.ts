import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Dictionary } from '../dictionary'; 
import { HomeService } from './home.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapComponent, RouterLink, RouterModule],
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

  constructor(private homeService: HomeService) {
    this.name = 'Ruta de prueba'
    this.user = 'Carlos Pérez'
    this.siguiendo = true;

    this.type = 0;   
  }

  ngOnInit(): void{
    this.getData();

    console.log(this.routes);
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

  getData() {
    this.homeService.getRoutes().subscribe((res) => {
      this.routes = res;
      this.homeService.getGPXData(this.routes).then((gpxData) => {
        this.dataMap = this.homeService.getDataMap(this.routes, gpxData);
      }).catch(error => {
        console.error('Error:', error);
      });
    });
  }
}
