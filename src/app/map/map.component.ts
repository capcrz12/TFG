import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Input, Output, EventEmitter, SimpleChange, SimpleChanges } from '@angular/core';
import { Map, MapStyle, Marker, config, FullscreenControl, geolocation, GeolocateControl, Popup } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { gpx } from "@tmcw/togeojson";
import { Dictionary } from '../dictionary'; 

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
  dataMap: Dictionary;
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

    if (this.file != '' && this.type == 0) {
      // Llama a convertGPX con la ruta correcta del archivo GPX
      this.loadGPX(this.file);
    }
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
      

        this.map!.setMaxBounds([
          [this.coordinates.minLng - 0.1, this.coordinates.minLat - 0.1],
          [this.coordinates.maxLng + 0.1, this.coordinates.maxLat + 0.1]
        ]);

        this.map!.fitBounds([
          [this.coordinates.minLng - 0.02, this.coordinates.minLat - 0.02],
          [this.coordinates.maxLng + 0.02, this.coordinates.maxLat + 0.02]
        ]);    
      }

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

        this.dataMap['speed'] = this.calculateAverageSpeed(this.gpxData);
        this.dataMap['maxAltitude'] = this.calculateMaxAltitude(this.gpxData);
        this.dataMap['minAltitude'] = this.calculateMinAltitude(this.gpxData);
        this.dataMap['km'] = parseFloat(this.calculateTotalDistance(this.gpxData).toFixed(2));
        this.dataMap['des_neg'] = this.calculateNegativeElevationLoss(this.gpxData);
        this.dataMap['des_pos'] = this.calculatePositiveElevationGain(this.gpxData);
        this.elevationProfile = this.calculateElevationProfile(this.gpxData);
        this.dataMapOut.emit(this.dataMap);
        this.elevationProfileOut.emit(this.elevationProfile);
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

  // Función para calcular la altitud acumulada a partir de los datos del GPX
  calculateElevationProfile(gpxData: any): { kilometers: number[], altitudes: number[] } {
    if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
      return { kilometers: [], altitudes: [] }; // Retorna listas vacías si no hay datos
    }

    const features = gpxData.features[0]; // Tomar la primera feature del geoJSON
    const coords = features.geometry.coordinates; // Obtener las coordenadas de la ruta
    const elevationProfile = { kilometers: [] as number[], altitudes: [] as number[]};

    let totalDistance = 0; // Distancia total acumulada
    let totalElevation = 0; // Altitud total acumulada

    for (let i = 1; i < coords.length; i++) {
      const [prevLng, prevLat, prevAlt] = coords[i - 1];
      const [currLng, currLat, currAlt] = coords[i];

      // Calcular la distancia entre los dos puntos utilizando la fórmula de Haversine
      const distance = this.calculateDistance(prevLat, prevLng, currLat, currLng);
      totalDistance += distance;

      // Agregar la distancia acumulada y la altitud actual al perfil de elevación
      elevationProfile.kilometers.push(parseFloat(totalDistance.toFixed(2)));
      elevationProfile.altitudes.push(currAlt);

      // Actualizar la altitud total acumulada
      totalElevation += Math.abs(currAlt - prevAlt);
    }

    return elevationProfile;
  }

  // Calcular la velocidad promedio en kilómetros por hora (km/h)
calculateAverageSpeed(gpxData: any): number {
  if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
    return -1;
  }

  const features = gpxData.features[0];
  let totalDistance = 0; // en kilómetros
  let totalTimeInSeconds = 0; // en segundos

  // Recorrer cada punto del sendero para calcular la distancia y el tiempo
  for (let i = 1; i < features.geometry.coordinates.length; i++) {
    const prevCoord = features.geometry.coordinates[i-1];
    const currCoord = features.geometry.coordinates[i];

    const distance = this.calculateDistance(prevCoord[1], prevCoord[0], currCoord[1], currCoord[0]); // en kilómetros
    const prev = new Date(features.properties.coordinateProperties.times[i-1]).valueOf();
    const curr = new Date(features.properties.coordinateProperties.times[i]).valueOf();
    const timeDiffInSeconds = (curr - prev) / 1000;

    totalDistance += distance;
    totalTimeInSeconds += timeDiffInSeconds;
  }

  // Calcular velocidad promedio en km/h
  if (totalTimeInSeconds > 0) {
    const averageSpeed = (totalDistance / (totalTimeInSeconds / 3600)).toFixed(2); // convertir a km/h
    return parseFloat(averageSpeed);
  }

  return -1;
}

// Calcular distancia entre dos coordenadas geográficas utilizando la fórmula haversine
calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // radio de la Tierra en kilómetros
  const dLat = this.degreesToRadians(lat2 - lat1);
  const dLon = this.degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // distancia en kilómetros
  return distance;
}

calculateMaxAltitude(gpxData: any): number {
  if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
    return -1;
  }

  let maxAltitude = -Infinity;
  const features = gpxData.features[0];

  // Recorrer cada punto del sendero para encontrar la altitud máxima
  for (let i = 1; i < features.geometry.coordinates.length; i++) {

    let altitude = features.geometry.coordinates[i][2]; // La altitud es el tercer elemento del array de coordenadas
    if (altitude > maxAltitude) {
      maxAltitude = altitude;
    }
  }

  // Si maxAltitude sigue siendo igual a -Infinity, significa que no se encontraron altitudes válidas
  // en el archivo GPX
  if (maxAltitude === -Infinity) {
    return -1;
  }

  return parseFloat(maxAltitude.toFixed(0));
}

calculateMinAltitude(gpxData: any): number {
  if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
    return -1;
  }

  let minAltitude = Infinity;
  const features = gpxData.features[0];

  // Recorrer cada punto del sendero para encontrar la altitud máxima
  for (let i = 1; i < features.geometry.coordinates.length; i++) {

    let altitude = features.geometry.coordinates[i][2]; // La altitud es el tercer elemento del array de coordenadas
    if (altitude < minAltitude) {
      minAltitude = altitude;
    }
  }

  // Si maxAltitude sigue siendo igual a -Infinity, significa que no se encontraron altitudes válidas
  // en el archivo GPX
  if (minAltitude === Infinity) {
    return -1;
  }

  return parseFloat(minAltitude.toFixed(0));
}

calculatePositiveElevationGain(gpxData: any): number {
  if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
    return -1;
  }

  let elevationGain = 0;

  // Recorrer cada punto del sendero para calcular el desnivel positivo
  for (let i = 1; i < gpxData.features[0].geometry.coordinates.length; i++) {
    const prevCoord = gpxData.features[0].geometry.coordinates[i - 1];
    const currCoord = gpxData.features[0].geometry.coordinates[i];
    const elevationChange = currCoord[2] - prevCoord[2]; // Cambio de altitud entre dos puntos
    if (elevationChange > 0) {
      elevationGain += elevationChange;
    }
  }

  return parseFloat(elevationGain.toFixed(0));
}

calculateNegativeElevationLoss(gpxData: any): number {
  if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
    return -1;
  }

  let elevationLoss = 0;

  // Recorrer cada punto del sendero para calcular el desnivel negativo
  for (let i = 1; i < gpxData.features[0].geometry.coordinates.length; i++) {
    const prevCoord = gpxData.features[0].geometry.coordinates[i - 1];
    const currCoord = gpxData.features[0].geometry.coordinates[i];
    const elevationChange = currCoord[2] - prevCoord[2]; // Cambio de altitud entre dos puntos
    if (elevationChange < 0) {
      elevationLoss += Math.abs(elevationChange); // Convertir a valor absoluto
    }
  }

  return parseFloat(elevationLoss.toFixed(0));
}


// Convertir grados a radianes
degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

calculateTotalDistance(gpxData: any): number {
  if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
    return 0;
  }

  let totalDistance = 0; // en kilómetros

  // Recorrer cada punto del sendero para calcular la distancia total
  for (let i = 1; i < gpxData.features[0].geometry.coordinates.length; i++) {
    const prevCoord = gpxData.features[0].geometry.coordinates[i-1];
    const currCoord = gpxData.features[0].geometry.coordinates[i];
    const distance = this.calculateDistance(prevCoord[1], prevCoord[0], currCoord[1], currCoord[0]); // en kilómetros
    totalDistance += distance;
    totalDistance = parseFloat(totalDistance.toFixed(2));
  }

  return totalDistance;
}


  
  ngOnDestroy() {
    this.map?.remove();
  }
}
