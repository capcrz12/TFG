import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter, SimpleChange, SimpleChanges } from '@angular/core';
import { Map, MapStyle, Marker, config, FullscreenControl, geolocation, GeolocateControl, Popup } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { Dictionary } from '../../dictionary'; 
import { getExtremes, calculateElevationProfile } from '../../utils/map';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

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
  imageExists: boolean = false;
  point: any;
  image: any;
  popup: Popup | any;

  @Input() type = -1; // type == 0 for rute maps / type == 1 for search maps
  @Input() file = '';
  @Input() routes:Dictionary[] = [];
  @Input() pointHovered = -1;
  @Input() coordsSelected:any = {};
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
      'pos_desnivel': -1,
      'neg_desnivel': -1,
      'max_alt': -1,
      'min_alt': -1,
    }
    
    this.speed = 0;
    this.km = 0;
    this.elevationProfile = { kilometers: [] as number[], altitudes: [] as number[]};
  }

  /**
   * 
   * Función para inicializar el componente
   * 
   * - Obtener los datos de las rutas
   * - Obtener los datos de GPX
   * - Calcular el perfil de elevación
   * - Emitir los datos de mapa y perfil de elevación
   *  
   */
  ngOnInit(): void {
    config.apiKey = environment.mapKey;
    this.elevationProfile = calculateElevationProfile(this.gpxData);
    this.dataMapOut.emit(this.dataMap);
    this.elevationProfileOut.emit(this.elevationProfile);

    this.routesGeoJson = convertRoutesToGeoJSON(this.routes);
  }

  /**
   * 
   * Función para inicializar la mapa
   * 
   * - Inicializar la mapa
   * - Configurar el estilo de la mapa
   * - Configurar el estado inicial de la mapa
   * - Añadir la capa de GPX
   * - Añadir la capa de rutas
   * - Añadir la capa de puntos
   * - Añadir el evento de zoom
   * - Añadir el evento de click
   * 
   */
  ngAfterViewInit() {
    // Spain coordinates
    const initialState = { lng: -3.585342, lat: 15, zoom: 2, pitch: 50, maxPitch: 85 };
     
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      //style: `https://api.maptiler.com/maps/winter-v2/style.json?key=${config.apiKey}`,
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${config.apiKey}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
      pitch: initialState.pitch,
      maxPitch: initialState.maxPitch,
      geolocate: false,
      geolocateControl: false,
    });

    this.map!.addControl(new FullscreenControl());

    // Añadimos una capa nueva para introducir el raster 3D
    this.map.on('load', async () => {
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

        // Cargar la imagen del senderista
        let image = await this.map!.loadImage('../../assets/images/senderismo.png');
        this.map!.addImage('senderista', image.data);

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
            type: 'symbol' /* 'circle' */,
            source: 'routes',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'icon-image': 'senderista',   // Se añade al mapa mas arriba
              'icon-size': 0.06
            }
            /*
            paint: {
                'circle-color': '#FFFFFF',
                'circle-radius': 5,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#000'
            }
            */
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
          console.log(e!.features![0]);
          const user = e!.features![0].properties['user_name'];

          // Ensure that if the map is zoomed out such that
          // multiple copies of the feature are visible, the
          // popup appears over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          this.popup = new Popup()
              .setLngLat(coordinates)
              .setHTML(
                  `Ruta: ${name}<br>Km: ${km}<br>Autor: ${user}`
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

  /**
   * 
   * Función para actualizar los cambios en las propiedades
   * 
   * - Si el punto de interacción cambia, actualizar el punto interactivo
   * - Si se selecciona una imagen con coordenadas válidas, añadir el marcador de imagen 
   * 
   * @param changes Objeto con los cambios en las propiedades
   * 
   */
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

    if (changes['coordsSelected'] && this.coordsSelected) {
      const latitude = this.coordsSelected['lat'];
      const longitude = this.coordsSelected['lon'];
      if ((latitude > -90 && latitude < 90) && (longitude > -180 && longitude < 180))
        this.addImage(latitude, longitude);
      else
        this.deleteImage();
    }

    if (changes['filters'] && this.filters.length > 0) {
      if (this.map) {
        const source = this.map.getSource('routes') as maplibregl.GeoJSONSource;
  
        if (source) {
           // Aplica el filtro a los puntos sin agrupar
          this.map.setFilter('unclustered-point', this.filters);

  
          // Reagrupar y actualizar el número en los clusters
          this.updateClusters();
        }
      }
    }
  }
  
  /**
   * 
   * Función para actualizar los clusters después de aplicar filtros
   * 
   */  
  updateClusters() {
    if (this.map) {
      const source = this.map.getSource('routes') as maplibregl.GeoJSONSource;
  
      // Recalcula los clusters para reflejar los cambios
      if (source) {
        // Simplemente vuelve a cargar la fuente para forzar la actualización de los clusters
        this.map.triggerRepaint();
      }
    }
  }

  /**
   *
   * Función para añadir un punto interactivo
   * 
   * @param latitude Latitud del punto
   * @param longitude Longitud del punto
   * 
   */
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

  /**
   * 
   * Función para añadir un marcador de imagen
   * 
   * @param latitude Latitud de la imagen
   * @param longitude Longitud de la imagen
   * 
   */
  addImage(latitude: number, longitude: number): void {
    if (this.map && !this.imageExists) {

      const el = document.createElement('img');

      el.className = 'marker';
      el.src = `${this.coordsSelected['filename']}`;
      el.style.borderRadius = '60px';
      el.style.objectFit = 'cover';
      el.style.width = `4vw`;
      el.style.height = '4vw';

      this.image = new Marker({element: el})
        .setLngLat([longitude, latitude])
        .addTo(this.map);
      
        this.imageExists = true;
    }
    else if (this.imageExists) {
      // Update the data to a new position based on the animation timestamp. The
      // divisor in the expression `timestamp / 1000` controls the animation speed.
      this.image.setLngLat([longitude, latitude]);

      const currentElement = this.image.getElement() as HTMLImageElement;
      currentElement.src = `${this.coordsSelected['filename']}`;

        // Ensure it's added to the map. This is safe to call if it's already added.
        this.image.addTo(this.map);
    }
  }

  /**
   * 
   * Función para eliminar el marcador de imagen
   * 
   */
  deleteImage() {
    if (this.image) {
      this.image.remove();  // Elimina el marcador del mapa
      this.imageExists = false;  // Restablece la variable de control si es necesario
    }    
  }
 
  
  ngOnDestroy() {
    this.map?.remove();
  }
}

/**
 * 
 * Función para convertir las rutas a GeoJSON
 * 
 * @param routes 
 * @returns 
 * 
 */
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
      pos_desnivel: route.pos_desnivel,
      neg_desnivel: route.neg_desnivel,
      km: route.km,
      max_alt: route.max_alt,
      min_alt: route.min_alt,
      speed: route.speed,
      ubication: route.ubication,
      user_name: route.user['nombre']
    }
  }));

  return {
    type: 'FeatureCollection',
    features: features
  };
}