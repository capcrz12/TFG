import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { HttpClientModule, HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapComponent, RouterLink, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  name: string;
  user: string;
  siguiendo: boolean;
  routes:any = [];

  constructor(private http:HttpClient) {
    this.name = 'Ruta de prueba'
    this.user = 'Carlos Pérez'
    this.siguiendo = true;
  }

  ngOnInit(){
    this.getRoutes();
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
    })
  }
}
