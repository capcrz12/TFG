import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Map, MapStyle, Marker, config, FullscreenControl, geolocation, GeolocateControl } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { gpx } from "@tmcw/togeojson";

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map | undefined;
  gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  coordinates: any;
  bounds: any;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor() {}

  ngOnInit(): void {
    config.apiKey = 'xkstedU79vEq8uEaVE2A';

    // Llama a convertGPX con la ruta correcta del archivo GPX
    this.loadGPX('./assets/ruta.gpx');
  }

  ngAfterViewInit() {
    const initialState = { lng: -3.585342, lat: 37.161356, zoom: 5, pitch: 50, maxPitch: 85 };
  
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/winter-v2/style.json?key=${config.apiKey}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      pitch: 50,
      maxPitch: 85,
      geolocate: false,
      geolocateControl: false
    });

    this.map!.addControl(new FullscreenControl());


    // Añadimos una capa nueva para introducir el raster 3D
    this.map.on('load', () => {
      // Agregar capa para el archivo GPX
      this.map!.addSource('gpx', {
        type: 'geojson',
        data: this.gpxData // Usar datos convertidos de GPX
      });

      // Add new sources and layers
      this.map!.addSource("terrain", {
          "type": "raster-dem",
          "url": `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${config.apiKey}`
          });
      this.map!.setTerrain({
          source: "terrain"
      });

    this.map!.addLayer({
      id: 'gpx-route',
      type: 'line',
      source: 'gpx',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF0000',
        'line-width': 3
      }
    });

    this.map!.setMaxBounds([
      [this.coordinates.minLng - 0.1, this.coordinates.minLat - 0.1],
      [this.coordinates.maxLng + 0.1, this.coordinates.maxLat + 0.1]
    ]);

    this.map!.fitBounds([
      [this.coordinates.minLng - 0.02, this.coordinates.minLat - 0.02],
      [this.coordinates.maxLng + 0.02, this.coordinates.maxLat + 0.02]
    ]);    
  });


    new Marker({color: "#FF0000"})
      .setLngLat([-3.585342, 37.161356])
      .addTo(this.map);
  }

  // Método para cargar y convertir el archivo GPX
  loadGPX(filePath: string) {
    fetch(filePath)
      .then(response => response.text())
      .then(xml => {
        const gpxFile = new DOMParser().parseFromString(xml, 'text/xml');
        const geoJson = gpx(gpxFile); // Convertir GPX a GeoJSON
        this.gpxData = geoJson; // Guardar datos convertidos en una propiedad

        // Calcular coordenadas de los extremos
        this.coordinates = this.getExtremes(this.gpxData.features[0].geometry.coordinates);
        
        this.bounds = [
          [this.coordinates.minLng - 0.02, this.coordinates.minLat - 0.02],
          [this.coordinates.maxLng + 0.02, this.coordinates.maxLat + 0.02]
        ];
      })
      .catch(error => {
        console.error('Error loading GPX:', error);
      });
  }

  // Función para obtener las coordenadas de los extremos
  getExtremes(coords: number[][]): { minLat: number, maxLat: number, minLng: number, maxLng: number } {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    coords.forEach(coord => {
      const [lng, lat] = coord;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    return { minLat, maxLat, minLng, maxLng };
  }
  
  ngOnDestroy() {
    this.map?.remove();
  }
}
