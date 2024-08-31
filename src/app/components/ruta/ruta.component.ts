import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MapComponent } from '../map/map.component'; 
import { RouterOutlet, Router } from '@angular/router';
import { Dictionary } from '../../dictionary';
import { GraficaComponent } from '../grafica/grafica.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RutaService } from './ruta.service';
import { gpx } from '@maptiler/sdk';


@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [RouterOutlet, MapComponent, GraficaComponent, HttpClientModule],
  templateUrl: './ruta.component.html',
  styleUrl: './ruta.component.css'
})
export class RutaComponent implements OnInit, OnChanges {
  name: string = '';
  @Input() id: string = '';
  routeJSON:any = [];
  rutaId: number;
  pointHovered: number;

  dataMap: Dictionary;
  data: Dictionary [];
  gpxData: any;
  elevationProfile: any;
  min: number;
  hour: number;

  observer: IntersectionObserver | undefined;


  constructor(private rutaService:RutaService) {
    this.dataMap = {};
    this.data = [];
    this.rutaId = -1;
    this.pointHovered = -1;
    this.min = 0;
    this.hour = 0;
  }

  ngOnInit(): void {
    this.getRoute();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Define el umbral de visibilidad al 50%
    };

    // Obtener todos los elementos <p> dentro de #tabla-section
    const paragraphs = document.querySelectorAll('#tabla-seccion p');
  
    // Configurar un observador de intersección para cada <p>
    paragraphs.forEach(p => {
      this.observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Cuando el <p> es visible, aplicar una animación o clase
            p.classList.add('active');
          } else {
            // Cuando el <p> no es visible, revertir la animación o clase
            p.classList.remove('active');
          }
        });
      }, options);

      // Observar el elemento <p> actual
      this.observer!.observe(p);
    });
  }

  onPointHovered(kilometer: any) {
    this.pointHovered = kilometer;
  }
  
  receiveDataMap(dic:Dictionary) {
    this.dataMap = dic;
    this.setupIntersectionObserver();
  }

  receiveElevationProfile(elevationProfile: any) {
    this.elevationProfile = elevationProfile;
  }

  formatTime() {
    this.hour = Math.floor(this.dataMap['estimated_time'])
    this.min = Math.round((this.dataMap['estimated_time'] - this.hour) * 60);
  }

  getRoute(): void {
    this.rutaService.getData(this.id).subscribe({
      next: (data) => {
        this.routeJSON = data.routeJSON;
        this.gpxData = data.gpxData;
        this.dataMap = data.dataMap
        this.formatTime();
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
}
