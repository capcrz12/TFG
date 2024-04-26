import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Map, MapStyle, Marker, config, FullscreenControl, geolocation, GeolocateControl } from '@maptiler/sdk';
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
  @Output() dataMapOut = new EventEmitter<Dictionary>();


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
  }

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
      geolocateControl: false,
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

        this.dataMap['speed'] = this.calculateAverageSpeed(this.gpxData);
        this.dataMap['maxAltitude'] = this.calculateMaxAltitude(this.gpxData);
        this.dataMap['minAltitude'] = this.calculateMinAltitude(this.gpxData);
        this.dataMap['km'] = parseFloat(this.calculateTotalDistance(this.gpxData).toFixed(2));
        this.dataMap['des_neg'] = this.calculateNegativeElevationLoss(this.gpxData);
        this.dataMap['des_pos'] = this.calculatePositiveElevationGain(this.gpxData);
        this.dataMapOut.emit(this.dataMap);
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
