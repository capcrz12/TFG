import { Component, Input, OnInit } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Dictionary } from '../dictionary';
import { GraficaComponent } from '../grafica/grafica.component';

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [RouterOutlet, MapComponent, GraficaComponent],
  templateUrl: './ruta.component.html',
  styleUrl: './ruta.component.css'
})
export class RutaComponent implements OnInit {
  @Input() name = '';
  rutaId: number;
  pointHovered: number;

  dataMap: Dictionary;
  elevationProfile: any;

  observer: IntersectionObserver | undefined;


  constructor(private route: ActivatedRoute) {
    this.dataMap = {}
    this.rutaId = -1;
    this.pointHovered = -1;
    this.name = 'Ruta de prueba';
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.rutaId = params['id'];
    })
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
}
