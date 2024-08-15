import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter, SimpleChange, SimpleChanges } from '@angular/core';
import { Map, MapStyle, Marker, config, FullscreenControl, geolocation, GeolocateControl, Popup } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { gpx } from "@tmcw/togeojson";
import { Dictionary } from '../dictionary'; 
import { getExtremes, calculateElevationProfile } from '../utils/map';
import { Router } from '@angular/router';

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
  routesGeoJson: any;
  coordinates: any;
  bounds: any;
  @Input() dataMap: Dictionary;
  speed: number | undefined;
  km: number | undefined;
  elevationProfile: any;
  pointExists: boolean = false;
  point: any;
  popup: Popup | any;

  @Input() type = -1; // type == 0 for rute maps / type == 1 for search maps
  @Input() file = '';
  @Input() routes:Dictionary[] = [];
  @Input() pointHovered = -1;
  @Input() filters: any = [];


  @Output() dataMapOut = new EventEmitter<Dictionary>();
  @Output() elevationProfileOut = new EventEmitter<any>();
  @Output() mapHovered = new EventEmitter<number>();



  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(private router:Router) {
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

    this.routesGeoJson = convertRoutesToGeoJSON(this.routes);
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
        this.map!.addSource('routes', {
          type: 'geojson',
          data: this.routesGeoJson,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        this.map!.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'routes',
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
                    '#60f073',
                    10,
                    '#f1f075',
                    50,
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
            source: 'routes',
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
            source: 'routes',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#FFFFFF',
                'circle-radius': 5,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#000'
            }
        });

        // inspect a cluster on click
        this.map!.on('click', 'clusters', async (e) => {
          const features = this.map!.queryRenderedFeatures(e.point, {
              layers: ['clusters']
          });
          const clusterId = features[0].properties['cluster_id'];
           // Type assertion to fix the TypeScript error
          const source = this.map!.getSource('routes') as maplibregl.GeoJSONSource;

          if (source && source.getClusterExpansionZoom) {
              const zoom = await source.getClusterExpansionZoom(clusterId);
              // Another type assertion for geometry.coordinates
              const coordinates = (features[0].geometry as GeoJSON.Point).coordinates;
              this.map!.easeTo({
                  center: coordinates as maplibregl.LngLatLike,
                  zoom: zoom
              });
          } else {
              console.error("Source not found or doesn't support clustering.");
          }
      });

        // When a click event occurs on a feature in
        // the unclustered-point layer, open a popup at
        // the location of the feature, with
        // description HTML from its properties.
        this.map!.on('mouseover', 'unclustered-point', (e) => {
          const coordinates = (e!.features![0] as any).geometry.coordinates.slice();
          const name = e!.features![0].properties['name'];
          const km = e!.features![0].properties['km'];

          // Ensure that if the map is zoomed out such that
          // multiple copies of the feature are visible, the
          // popup appears over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          this.popup = new Popup()
              .setLngLat(coordinates)
              .setHTML(
                  `Ruta: ${name}<br>Km: ${km}`
              )
              .addTo(this.map!);
        });

        this.map!.on('mouseout', 'unclustered-point', (e) => {
          if (this.popup) {
            this.popup.remove();  // Elimina el popup del mapa
            this.popup = null;    // Asegúrate de que la variable popup no apunte a un popup eliminado
          }
        })

        this.map!.on('click', 'unclustered-point', (e) => {
          const id = e!.features![0].properties['id'];

          this.router.navigate([`/ruta/${id}`]);
        })
      

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

    if (changes['filters']) {
      if (this.map) {
        const source = this.map.getSource('routes') as maplibregl.GeoJSONSource;
        if (source) {
          // Verifica que la fuente existe antes de aplicar el filtro
          this.map.setFilter('unclustered-point', this.filters);
          this.map.setFilter('clusters', this.filters);
        } else {
          console.error("Source 'routes' no encontrado.");
        }
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

function convertRoutesToGeoJSON(routes: any[]): any {//GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features = routes.map(route => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [route.lon, route.lat]
    },
    properties: {
      id: route.id,
      name: route.name,
      estimated_time: route.estimated_time,
      des_pos: route.des_pos,
      des_neg: route.des_neg,
      km: route.km,
      maxAltitude: route.maxAltitude,
      minAltitude: route.minAltitude,
      speed: route.speed,
      ubication: route.ubication
    }
  }));

  return {
    type: 'FeatureCollection',
    features: features
  };
}