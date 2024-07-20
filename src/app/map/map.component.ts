import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter, SimpleChange, SimpleChanges } from '@angular/core';
import { Map, MapStyle, Marker, config, FullscreenControl, geolocation, GeolocateControl, Popup } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { gpx } from "@tmcw/togeojson";
import { Dictionary } from '../dictionary'; 
import { getExtremes, calculateElevationProfile } from '../utils/map';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map | undefined;
  @Input() gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  coordinates: any;
  bounds: any;
  @Input() dataMap: Dictionary;
  speed: number | undefined;
  km: number | undefined;
  elevationProfile: any;
  pointExists: boolean = false;
  point: any;

  @Input() type = -1; // type == 0 for rute maps / type == 1 for search maps
  @Input() file = '';
  @Input() pointHovered = -1;


  @Output() dataMapOut = new EventEmitter<Dictionary>();
  @Output() elevationProfileOut = new EventEmitter<any>();
  @Output() mapHovered = new EventEmitter<number>();



  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor() {
    this.dataMap = {
      'speed': -1,
      'km': -1,
      'des_pos': -1,
      'des_neg': -1,
      'maxAltitude': -1,
      'minAltitude': -1,
    }


    
    this.speed = 0;
    this.km = 0;
    this.elevationProfile = { kilometers: [] as number[], altitudes: [] as number[]};
  }

  ngOnInit(): void {
    config.apiKey = 'xkstedU79vEq8uEaVE2A';
    this.elevationProfile = calculateElevationProfile(this.gpxData);
    this.dataMapOut.emit(this.dataMap);
    this.elevationProfileOut.emit(this.elevationProfile);
    }

  ngAfterViewInit() {
    // Spain coordinates
    const initialState = { lng: -3.585342, lat: 37.161356, zoom: 5, pitch: 50, maxPitch: 85 };
     
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/winter-v2/style.json?key=${config.apiKey}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      pitch: 50,
      maxPitch: 85,
      geolocate: false,
      geolocateControl: false,
    });

    this.map!.addControl(new FullscreenControl());

    // Añadimos una capa nueva para introducir el raster 3D
    this.map.on('load', () => {
      // Para mapas de ruta
      if (this.type == 0) {
        // Agregar capa para el archivo GPX
        this.map!.addSource('gpx', {
          type: 'geojson',
          data: this.gpxData // Usar datos convertidos de GPX
        });
      }

      // Add new sources and layers
      this.map!.addSource("terrain", {
          "type": "raster-dem",
          "url": `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${config.apiKey}`
          });
      this.map!.setTerrain({
          source: "terrain"
      });

      // Para mapas de ruta
      if (this.type == 0) {
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
      
        this.coordinates = getExtremes(this.gpxData.features[0].geometry.coordinates);


        this.map!.setMaxBounds([
          [this.coordinates.minLng - 0.1, this.coordinates.minLat - 0.1],
          [this.coordinates.maxLng + 0.1, this.coordinates.maxLat + 0.1]
        ]);

        this.map!.fitBounds([
          [this.coordinates.minLng - 0.02, this.coordinates.minLat - 0.02],
          [this.coordinates.maxLng + 0.02, this.coordinates.maxLat + 0.02]
        ]);    
      }

      // Para mapa explorar
      if (this.type == 1) {
        // Add a new source from our GeoJSON data and
        // set the 'cluster' option to true. GL-JS will
        // add the point_count property to your source data.
        this.map!.addSource('rutes', {
          type: 'geojson',
          // Point to GeoJSON data. This example visualizes all M1.0+ rutes
          // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
          data: 'https://maplibre.org/maplibre-gl-js/docs/assets/earthquakes.geojson',
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        this.map!.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'rutes',
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions (https://maplibre.org/maplibre-style-spec/#expressions-step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                ]
            }
        });

        this.map!.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'rutes',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        this.map!.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'rutes',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#11b4da',
                'circle-radius': 4,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

        // When a click event occurs on a feature in
        // the unclustered-point layer, open a popup at
        // the location of the feature, with
        // description HTML from its properties.
        /*
        this.map!.on('click', 'unclustered-point', (e) => {
          if (e && e.features) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const mag = e.features[0].properties.mag;
            let tsunami;

            if (e.features[0].properties.tsunami === 1) {
                tsunami = 'yes';
            } else {
                tsunami = 'no';
            }
          }

          // Ensure that if the map is zoomed out such that
          // multiple copies of the feature are visible, the
          // popup appears over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new Popup()
              .setLngLat(coordinates)
              .setHTML(
                  `magnitude: ${mag}<br>Was there a tsunami?: ${tsunami}`
              )
              .addTo(this.map!);
      });
      */

        this.map!.on('mouseenter', 'clusters', () => {
          this.map!.getCanvas().style.cursor = 'pointer';
        });
        this.map!.on('mouseleave', 'clusters', () => {
          this.map!.getCanvas().style.cursor = '';
        });

        this.map!.on('mouseenter', 'unclustered-point', () => {
          this.map!.getCanvas().style.cursor = 'pointer';
        });
        this.map!.on('mouseleave', 'unclustered-point', () => {
          this.map!.getCanvas().style.cursor = '';
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pointHovered'] && this.pointHovered !== -1 && this.elevationProfile) {
      const index = this.elevationProfile.kilometers.indexOf(this.pointHovered);
      if (index !== -1) {
        let elev = parseFloat(this.elevationProfile.altitudes[index].toFixed(1));
        let indice = -1;

        for (let i = 0; i < this.gpxData.features[0].geometry.coordinates.length && indice == -1 ; i++) {
          if (parseFloat(this.gpxData.features[0].geometry.coordinates[i][2].toFixed(1)) == elev) {
            indice = i;
          }  
        }

        const latitude = this.gpxData.features[0].geometry.coordinates[indice][0];
        const longitude = this.gpxData.features[0].geometry.coordinates[indice][1];
        this.addInteractivePoint(longitude, latitude);
      }
    }
  }

  addInteractivePoint(latitude: number, longitude: number): void {
    if (this.map && !this.pointExists) {
      this.point = new Marker()
        .setLngLat([longitude, latitude])
        .addTo(this.map);
      
        this.pointExists = true;
    }
    else if (this.pointExists) {
      // Update the data to a new position based on the animation timestamp. The
      // divisor in the expression `timestamp / 1000` controls the animation speed.
      this.point.setLngLat([longitude, latitude]);

        // Ensure it's added to the map. This is safe to call if it's already added.
        this.point.addTo(this.map);
    }
  }
  
  
  
  ngOnDestroy() {
    this.map?.remove();
  }
}