import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { calculateAverageSpeed, calculateEstimatedTime, calculateMaxAltitude, calculateMinAltitude, calculateNegativeElevationLoss, calculatePositiveElevationGain, calculateTotalDistance, cargarGPX } from '../../utils/map';
import { gpx } from "@tmcw/togeojson";
import { MapComponent } from "../map/map.component";
import { NuevaRutaService } from './nueva-ruta.service';
import { Dictionary } from '../../dictionary';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nueva-ruta',
  standalone: true,
  imports: [FormsModule, CommonModule, MapComponent],
  templateUrl: './nueva-ruta.component.html',
  styleUrl: './nueva-ruta.component.css'
})
export class NuevaRutaComponent implements OnInit, OnDestroy {

  name: string;
  ubication: string;
  description: string;
  gpx: File | null;
  gpxData: any;
  errorMessage: string = '';
  successMessage: string = '';

  selectedImages: File[] = [];

  speed: number;
  max_alt: number;
  min_alt: number;
  km: number;
  pos_desnivel: number;
  neg_desnivel: number;
  estimated_time: number;
  estimated_hour: number;
  estimated_min: number;
  ruta: Dictionary;

  paso: number = 1;

  constructor (private nuevaService: NuevaRutaService, private router: Router) {
    this.name = '';
    this.ubication = '';
    this.description = '';
    this.gpx = null;
    this.gpxData = null;

    this.speed = -1;
    this.max_alt = -1;
    this.min_alt = -1;
    this.km = -1;
    this.pos_desnivel = -1;
    this.neg_desnivel = -1;
    this.estimated_time = -1;
    this.estimated_hour = -1;
    this.estimated_min = -1;
    this.ruta = {};
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    // Listener para recargar página
    window.addEventListener('beforeunload', this.confirmExit);

  }

  ngOnDestroy(): void {
    // Eliminar listener
    window.removeEventListener('beforeunload', this.confirmExit);
  }

  // Función para el evento de confirmar recarga de página
  @HostListener('window:beforeunload', ['$event'])
  confirmExit(event: BeforeUnloadEvent) {
    // Prevenir la acción predeterminada del evento (recargar/navegar)
    event.preventDefault();

    // El mensaje que se mostrará en el cuadro de diálogo (la mayoría de navegadores ignora este mensaje personalizado)
    event.returnValue = 'Tiene cambios sin guardar. ¿Está seguro de que desea salir?';
  }


  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.gpx = file;
      console.log('Archivo seleccionado correctamente.');
    } else {
      console.log('No se seleccionó ningún archivo.');
    }
  }
 
  onImagesSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedImages = Array.from(event.target.files);
    }
  }

  back () {
    if (this.paso>1) this.paso--;
  }

  submit () {
    if (this.name == '' || this.ubication == '') {
      this.errorMessage = 'Complete todos los campos por favor.';
      return;
    }
    else if (!this.gpx) {
      this.errorMessage = 'Añada un fichero GPX por favor.';
      return;
    }
    else {
      this.successMessage = 'Procesando...';
      this.errorMessage = '';

      if (this.gpx != null) { 
        this.calculateGPX();
      }
    }
  }

  convertirAGeoJson(gpxContent: string): any {
    try {
      // Parsear el archivo GPX (contenido XML) usando DOMParser
      const gpxFile = new DOMParser().parseFromString(gpxContent, 'text/xml');
      
      // Convertir el archivo GPX a formato GeoJSON usando una biblioteca GPX a GeoJSON
      const geoJson = gpx(gpxFile); // Asegúrate de que 'gpx' es una función que convierta a GeoJSON
      
      return geoJson;
    } catch (error) {
      console.error('Error al procesar el archivo GPX:', error);
      return null;
    }
  }

  updateEstimatedTime() {
    this.estimated_time = calculateEstimatedTime(this.km, this.speed);

    this.estimated_hour = Math.floor(this.estimated_time); 
    this.estimated_min = Math.round((this.estimated_time - this.estimated_hour) * 60);
  }

calculateGPX () {
  try {
      if (!this.gpx) {
        this.errorMessage = 'No se ha seleccionado ningún archivo GPX.';
        this.successMessage = '';
        console.log('No se ha seleccionado ningún archivo GPX.');
        return;
      }

      // Usar FileReader para leer el contenido del archivo GPX
      const reader = new FileReader();

      reader.onload = async (event: any) => {
        const gpxContent = event.target.result;

        // Cargar y convertir el contenido del archivo GPX
        this.gpxData = await this.convertirAGeoJson(gpxContent); 

        if (!this.gpxData) {
          this.errorMessage = 'Error al procesar el archivo GPX.';
          this.successMessage = '';
          console.log('Error al procesar el archivo GPX');
          return;
        }

        // Extraer datos del GPX
        this.speed = calculateAverageSpeed(this.gpxData);
        this.max_alt = calculateMaxAltitude(this.gpxData);
        this.min_alt = calculateMinAltitude(this.gpxData);
        this.km = calculateTotalDistance(this.gpxData);
        this.pos_desnivel = calculatePositiveElevationGain(this.gpxData);
        this.neg_desnivel = calculateNegativeElevationLoss(this.gpxData);
        this.updateEstimatedTime();
 
        this.successMessage = 'Archivo GPX procesado exitosamente.';

        this.paso++;
      };

      reader.onerror = (error) => {
        this.errorMessage = 'Error al leer el archivo: ' + error;
        console.log('Error al leer el archivo:', error);
      };
  
      if (this.gpx instanceof File) {
        reader.readAsText(this.gpx);
      } else {
        console.log('Error: this.gpx no es un archivo válido');
      }
        
    } catch (error) {
      this.errorMessage = 'Error al procesar el archivo GPX: ' + error;
      this.successMessage = '';
      console.log(error);
      this.successMessage = '';
    }
  }

  subirRuta () {
    this.ruta['name'] = this.name;
    this.ruta['ubication'] = this.ubication;
    this.ruta['description'] = this.description;
    this.ruta['speed'] = this.speed;
    this.ruta['km'] = this.km;
    this.ruta['estimated_time'] = this.estimated_time;
    this.ruta['max_alt'] = this.max_alt;
    this.ruta['min_alt'] = this.min_alt;
    this.ruta['pos_desnivel'] = this.pos_desnivel;
    this.ruta['neg_desnivel'] = this.neg_desnivel;
    this.ruta['lat'] = this.gpxData.features[0].geometry.coordinates[0][1];
    this.ruta['lon'] = this.gpxData.features[0].geometry.coordinates[0][0];

    this.nuevaService.upload(this.ruta, this.gpx!).subscribe({
      next: async (response: any) => {
        this.successMessage = 'Ruta añadida con éxito';
        await this.uploadImages(response.id);

        this.router.navigate(['/myFeed'], { state: { message: 'Ruta añadida con éxito' } }); // Navega a la página principal
      },
      error: (error: any) => {
        this.errorMessage = 'Error al añadir la ruta: ' + (error as Error).message;
        console.error('Error en la solicitud: ', error);
      }
    });    
  } 
  
  uploadImages(routeId: number) {
    const formData = new FormData();
    this.selectedImages.forEach((image, index) => {
      formData.append('images', image, image.name);
    });
  
    return this.nuevaService.uploadImages(routeId, formData);
  }
}
