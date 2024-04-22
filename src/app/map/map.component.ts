import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Map, Marker, config, FullscreenControl } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { gpx } from "@tmcw/togeojson";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map | undefined;
  gpxData: any;
  coordinates: any;
  bounds: any;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor() {}

  ngOnInit(): void {
    config.apiKey = 'xkstedU79vEq8uEaVE2A';
    this.loadGPX('./assets/ruta.gpx');
  }

  ngAfterViewInit(): void {
    const initialState = { lng: -3.585342, lat: 37.161356, zoom: 5, pitch: 50, maxPitch: 85 };
  
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/winter-v2/style.json?key=${config.apiKey}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      pitch: initialState.pitch,
      maxPitch: initialState.maxPitch,
      geolocate: false,
      geolocateControl: false
    });

    this.map.addControl(new FullscreenControl());

    this.map.on('load', () => {
      this.map.addSource('gpx', {
        type: 'geojson',
        data: this.gpxData
      });

      this.map.addLayer({
        id: 'gpx-route',
        type: 'line',
        source: 'gpx',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'interpolate',
            ['linear'],
            ['/', ['-', ['get', 'elev2'], ['get', 'elev1']], ['get', 'distance']],
            -10, 'blue',   // Color azul para pendientes negativas
            10, 'red'      // Color rojo para pendientes positivas
          ],
          'line-width': 3
        }
      });

      this.map.setMaxBounds([
        [this.coordinates.minLng - 0.1, this.coordinates.minLat - 0.1],
        [this.coordinates.maxLng + 0.1, this.coordinates.maxLat + 0.1]
      ]);

      this.map.fitBounds([
        [this.coordinates.minLng - 0.02, this.coordinates.minLat - 0.02],
        [this.coordinates.maxLng + 0.02, this.coordinates.maxLat + 0.02]
      ]);    
    });

    new Marker({ color: "#FF0000" })
      .setLngLat([-3.585342, 37.161356])
      .addTo(this.map);
  }

  loadGPX(filePath: string): void {
    fetch(filePath)
      .then(response => response.text())
      .then(xml => {
        const gpxFile = new DOMParser().parseFromString(xml, 'text/xml');
        const geoJson = gpx(gpxFile);
        this.gpxData = geoJson;

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
  
  ngOnDestroy(): void {
    this.map?.remove();
  }
}
