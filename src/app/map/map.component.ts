import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Map, MapStyle, Marker, config } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map | undefined;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  ngOnInit(): void {
    config.apiKey = 'xkstedU79vEq8uEaVE2A';
  }

  ngAfterViewInit() {
    const initialState = { lng: -3.60667, lat: 37.18817, zoom: 12, pitch: 50, maxPitch: 85 };
  
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/winter-v2/style.json?key=${config.apiKey}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      pitch: 50,
      maxPitch: 85
    });

    // Añadimos una capa nueva para introducir el raster 3D
    this.map.on('load', () => {
      // Add new sources and layers
      this.map.addSource("terrain", {
          "type": "raster-dem",
          "url": `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${API_KEY}`
          });
      this.map.setTerrain({
          source: "terrain"
      });
  });


    new Marker({color: "#FF0000"})
      .setLngLat([-3.60667, 37.18817])
      .addTo(this.map);
  }
  
  ngOnDestroy() {
    this.map?.remove();
  }
}
