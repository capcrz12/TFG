import { from, Observable } from 'rxjs';
import { Dictionary } from '../dictionary'; 
import { gpx } from "@tmcw/togeojson";

//////////////////////////////////////////////////////////////
  // Calculos estadisticos a partir del archivo GPX

  // Método para cargar y convertir el archivo GPX
  export function cargarGPX(filePath: string): Promise<any> {
    return fetch(filePath)
      .then(response => response.text())
      .then(xml => {
        const gpxFile = new DOMParser().parseFromString(xml, 'text/xml');
        const geoJson = gpx(gpxFile); // Convertir GPX a GeoJSON
        let gpxData: any = geoJson; // Guardar datos convertidos en una propiedad
        return gpxData;
      })
      .catch(error => {
        console.error('Error loading GPX:', error);
      });
  }
  
  export function cargarGPXObservable(filePath: string): Observable<any> {
    return from(
      fetch(filePath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}`);
          }
          return response.text();
        })
        .then(xml => {
          const gpxFile = new DOMParser().parseFromString(xml, 'text/xml');
          const geoJson = gpx(gpxFile); // Convertir GPX a GeoJSON
          return geoJson; // Devolver datos convertidos
        })
        .catch(error => {
          console.error('Error loading GPX:', error);
          throw error; // Propagar el error para manejarlo adecuadamente
        })
    );
  }


  export function getData(gpxData: any, route: any, index: number/*, dataMap: any*/) {
        // Calcular coordenadas de los extremos
        let coordinates = getExtremes(gpxData.features[0].geometry.coordinates);
        
        let bounds = [
          [coordinates.minLng - 0.02, coordinates.minLat - 0.02],
          [coordinates.maxLng + 0.02, coordinates.maxLat + 0.02]
        ];

        /*
        if (!dataMap[index]) {
          dataMap[index] = {} as Dictionary;
        }

         
        dataMap no es necesario puesto que se guardan dichos datos en la base de datos
        
        dataMap[index]['id'] = route.id;
        dataMap[index]['name'] = route.name;
        dataMap[index]['ubication'] = route.ubication;
        dataMap[index]['speed'] = calculateAverageSpeed(gpxData);
        dataMap[index]['max_alt'] = calculateMaxAltitude(gpxData);
        dataMap[index]['min_alt'] = calculateMinAltitude(gpxData);
        dataMap[index]['km'] = parseFloat(calculateTotalDistance(gpxData).toFixed(2));
        dataMap[index]['neg_desnivel'] = calculateNegativeElevationLoss(gpxData);
        dataMap[index]['pos_desnivel'] = calculatePositiveElevationGain(gpxData);
        */
  }

  export function getStatistics(route: any, dataMap: any, index: number) {
    if (!dataMap[index]) {
      dataMap[index] = {} as Dictionary;
    }

    dataMap[index]['id'] = route.id;
    dataMap[index]['user'] = route.id_usuario;
    dataMap[index]['name'] = route.name;
    dataMap[index]['description'] = route.description;
    dataMap[index]['ubication'] = route.ubication;
    dataMap[index]['speed'] = route.speed;
    dataMap[index]['estimated_time'] = route.estimated_time;
    dataMap[index]['max_alt'] = route.max_alt;
    dataMap[index]['min_alt'] = route.min_alt;
    dataMap[index]['km'] = route.km;
    dataMap[index]['neg_desnivel'] = route.neg_desnivel;
    dataMap[index]['pos_desnivel'] = route.pos_desnivel;
    dataMap[index]['lat'] = route.lat;
    dataMap[index]['lon'] = route.lon;
  }

  // Función para obtener las coordenadas de los extremos
  export function getExtremes(coords: number[][]): { minLat: number, maxLat: number, minLng: number, maxLng: number } {
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
  export function calculateElevationProfile(gpxData: any): { kilometers: number[], altitudes: number[] } {
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
      const distance = calculateDistance(prevLat, prevLng, currLat, currLng);
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
  export function calculateAverageSpeed(gpxData: any): number {
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

      const distance = calculateDistance(prevCoord[1], prevCoord[0], currCoord[1], currCoord[0]); // en kilómetros
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
  export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // radio de la Tierra en kilómetros
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // distancia en kilómetros

    return distance;
  }

  // Calcular el tiempo promedio de recorrido
  export function calculateEstimatedTime(km: number, speed: number):  number {
    return parseFloat((km / speed).toFixed(2));
  }

  export function calculateMaxAltitude(gpxData: any): number {
    if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
      return -1;
    }

    let max_alt = -Infinity;
    const features = gpxData.features[0];

    // Recorrer cada punto del sendero para encontrar la altitud máxima
    for (let i = 1; i < features.geometry.coordinates.length; i++) {

      let altitude = features.geometry.coordinates[i][2]; // La altitud es el tercer elemento del array de coordenadas
      if (altitude > max_alt) {
        max_alt = altitude;
      }
    }

    // Si max_alt sigue siendo igual a -Infinity, significa que no se encontraron altitudes válidas
    // en el archivo GPX
    if (max_alt === -Infinity) {
      return -1;
    }

    return parseFloat(max_alt.toFixed(0));
  }

  export function calculateMinAltitude(gpxData: any): number {
    if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
      return -1;
    }

    let min_alt = Infinity;
    const features = gpxData.features[0];

    // Recorrer cada punto del sendero para encontrar la altitud máxima
    for (let i = 1; i < features.geometry.coordinates.length; i++) {

      let altitude = features.geometry.coordinates[i][2]; // La altitud es el tercer elemento del array de coordenadas
      if (altitude < min_alt) {
        min_alt = altitude;
      }
    }

    // Si min_alt sigue siendo igual a -Infinity, significa que no se encontraron altitudes válidas
    // en el archivo GPX
    if (min_alt === Infinity) {
      return -1;
    }

    return parseFloat(min_alt.toFixed(0));
  }

  export function calculatePositiveElevationGain(gpxData: any): number {
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

  export function calculateNegativeElevationLoss(gpxData: any): number {
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
  export function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  export function calculateTotalDistance(gpxData: any): number {
    if (!gpxData || !gpxData.features || gpxData.features.length === 0) {
      return 0;
    }

    let totalDistance = 0; // en kilómetros

    // Recorrer cada punto del sendero para calcular la distancia total
    for (let i = 1; i < gpxData.features[0].geometry.coordinates.length; i++) {
      const prevCoord = gpxData.features[0].geometry.coordinates[i-1];
      const currCoord = gpxData.features[0].geometry.coordinates[i];
      const distance = calculateDistance(prevCoord[1], prevCoord[0], currCoord[1], currCoord[0]); // en kilómetros
      totalDistance += distance;
      totalDistance = parseFloat(totalDistance.toFixed(2));
    }

    return totalDistance;
  }