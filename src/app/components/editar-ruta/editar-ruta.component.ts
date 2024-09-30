import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { calculateEstimatedTime } from '../../utils/map';
import { gpx } from "@tmcw/togeojson";
import { MapComponent } from "../map/map.component";
import { Dictionary } from '../../dictionary';
import { RutaService } from '../ruta/ruta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EditarRutaService } from './editar-ruta.service';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { NuevaRutaService } from '../nueva-ruta/nueva-ruta.service';
import * as exifr from 'exifr';
import { areCoordsNear } from '../../utils/map';

@Component({
  selector: 'app-editar-ruta',
  standalone: true,
  imports: [FormsModule, CommonModule, MapComponent, SlickCarouselModule],
  templateUrl: './editar-ruta.component.html',
  styleUrl: './editar-ruta.component.css'
})
export class EditarRutaComponent {
  id: number;
  idPerfil: number;
  gpxData: any;
  errorMessage: string = '';
  successMessage: string = '';

  hour: number = -1;
  min: number = -1;

  dataMap: Dictionary;
  ruta: Dictionary;
  routeJSON:any = [];
  data: Dictionary [];

  selectedImages: File[] = [];
  selectedImage: string = "";
  slides: string[] = [];     // Array de URLs de las imágenes
  coordImages: {lat: number, lon: number}[] = [];


  constructor (private rutaService: RutaService, 
    private editarService: EditarRutaService, 
    private route: ActivatedRoute, 
    private router: Router,
    private nuevaService: NuevaRutaService) {
    this.id = -1;
    this.idPerfil = -1;
    this.gpxData = null;

    this.dataMap = {};
    this.data = [];
    this.ruta = {};
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.route.params.subscribe(params => {
      this.id = +params['id'];
      this.idPerfil = +params['idPerfil']; 

      this.getRoute();
      this.getImages();
    });
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


  /**
   * 
   * Función para obtener la ruta
   * 
   */
  getRoute(): void {
    this.rutaService.getData(String(this.id)).subscribe({
      next: (data) => {
        this.routeJSON = data.routeJSON;
        this.gpxData = data.gpxData;
        this.dataMap = data.dataMap;
        this.formatTime();
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  /**
   * 
   * Función para obtener las imágenes
   * 
   */
  getImages(): void {
    this.rutaService.getRouteImages(String(this.id)).subscribe({
      next: (images: any) => {
        images.forEach((image:any) => {
          this.slides.push(image.filename);  // Asigna las URLs de las imágenes
        })
      },
      error: (error) => {
        console.error('Error al cargar las imágenes:', error);
      }
    });
  }
  
  /**
   * 
   * Función para formatear el tiempo estimado
   * 
   */
  formatTime() {
    this.hour = Math.floor(this.dataMap['estimated_time'])
    this.min = Math.round((this.dataMap['estimated_time'] - this.hour) * 60);
  }

  /**
   * 
   * Función para actualizar el tiempo estimado
   *
   */
  updateEstimatedTime() {
    let km:number, speed :number;
    this.ruta['km'] ? km = this.ruta['km'] : km = this.dataMap['km'];
    this.ruta['speed'] ? speed = this.ruta['speed'] : speed = this.dataMap['speed'];


    this.ruta['estimated_time'] = calculateEstimatedTime(km, speed);

    this.hour = Math.floor(this.ruta['estimated_time']); 
    this.min = Math.round((this.ruta['estimated_time'] - this.hour) * 60);
  }

  /**
   * 
   * Función para convertir un archivo GPX a GeoJSON
   * 
   * @param gpxContent contenido del archivo GPX
   * @returns GeoJSON
   * 
   */
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

  /**
   * 
   * Función para subir la ruta
   *     
   * 
   * - Copiar los datos de dataMap a ruta
   * - El objeto usuario pasa a ser solo el id
   * - Actualizar la ruta en la base de datos
   * - Navegar a la página de perfil
   * 
   */
  subirRuta () {
    for (const key in this.dataMap) {
      if (this.dataMap.hasOwnProperty(key)) {
        // Si la clave no existe en ruta, la añadimos
        if (!(key in this.ruta)) {
          this.ruta[key] = this.dataMap[key];  // Copiar el valor de dataMap a ruta
        }
      }
    }

    this.ruta['user'] = this.ruta['user']['id'];

    this.editarService.updateRoute(this.ruta, this.idPerfil).subscribe({
      next: async (response: any) => {
        this.successMessage = 'Ruta añadida con éxito';
        await this.uploadImages(this.id);

        this.router.navigate(['/myFeed'], { state: { message: 'Ruta añadida con éxito' } }); // Navega a la página principal
      },
      error: (error: any) => {
        this.errorMessage = 'Error al añadir la ruta: ' + (error as Error).message;
        console.error('Error en la solicitud: ', error);
      }
    });
  }

  cancelar () {
    this.router.navigate(['/perfil', this.idPerfil]);
  }

  slideConfig = {"slidesToShow": 3, "slidesToScroll": 1};
  
  selectImage(img: string) {
    this.selectedImage = img;
  }
  
  slickInit(e: any) {
    this.selectImage(this.slides[0]);
  }
  
  breakpoint(e: any) {
    console.log('breakpoint');
  }
  
  afterChange(e: any) {
    console.log('afterChange');
  }
  
  beforeChange(e: any) {
    console.log('beforeChange');
  }

  /**
   * 
   * Función para almacenar las imágenes seleccionadas y
   * extraer los datos EXIF (coordenadas GPS)
   * 
   * @param event Evento de selección de archivos
   * 
   * - Extraer los datos EXIF de cada imagen seleccionada
   * - Almacenar las imagenes en el array de slides
   * 
   */
  onImagesSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedImages = Array.from(event.target.files);

      const exifPromises = this.selectedImages.map((image: File, index: number) => {
        const imageUrl = URL.createObjectURL(image);  // Generar un URL temporal para previsualizar la imagen
        this.slides.push(imageUrl);  // Añadir el URL al array de slides
  
        // función extractExifData para extraer los datos EXIF
        this.extractExifData(image, index);
      });

      // Esperar a que todas las promesas de extracción de EXIF se resuelvan
      Promise.all(exifPromises)
      .then(() => {
        console.log('Extracción de datos EXIF completada para todas las imágenes.');
      })
      .catch((error) => {
        console.error('Error al procesar los datos EXIF de las imágenes:', error);
      });
    }
  }

  /**
   * 
   * Función para extraer los datos EXIF de cada imagen seleccionada
   * 
   * @param image Archivo seleccionado
   * @param index Índice del archivo
   * 
   * - Extraer los datos EXIF de la imagen
   * - Almacenar las coordenadas GPS en el array coordImages
   * 
   * ! Almacena lat = 100 y lon = 100 si no se encuentran coordenadas GPS
   *
   */
  extractExifData(image: File, index: number): Promise<void> {
      return exifr.parse(image, { gps: true })
        .then((exifData) => {
          if (exifData) {
            const latitude = exifData.latitude;
            const longitude = exifData.longitude;
    
            if (latitude && longitude) {
              console.log(`Coordenadas GPS de la imagen ${index + 1}: Latitud ${latitude}, Longitud ${longitude}`);
    
              // Verificar proximidad con la ruta
              if (areCoordsNear(latitude, longitude, this.gpxData.features[0].geometry.coordinates, 1)) {
                console.log('Imagen cercana a la ruta.');
                this.coordImages[index] = { lat: latitude, lon: longitude };
              }
              else {
                this.coordImages[index] = { lat: 100, lon: 100 }; // Valores fuera de rango
              }
            } else {
              console.log(`No se encontraron coordenadas GPS en la imagen ${index + 1}`);
              this.coordImages[index] = { lat: 100, lon: 100 }; // Valores fuera de rango
            }
          } else {
            console.log(`No se encontraron datos EXIF en la imagen ${index + 1}`);
            this.coordImages[index] = { lat: 100, lon: 100 }; // Valores fuera de rango
          }
        })
        .catch((error) => {
          console.error(`Error al extraer los datos EXIF de la imagen ${index + 1}:`, error);
          this.coordImages[index] = { lat: 100, lon: 100 }; // Valores fuera de rango
        });
    }


  /**
   * 
   * Función para subir las imágenes
   * 
   * @param routeId ID de la ruta
   * 
   * - Almacenar los archivos seleccionados en el formulario
   * - Enviar el formulario a la ruta
   *
   */
  uploadImages(routeId: number) {
    const formData = new FormData();
    this.selectedImages.forEach((image, index) => {
      formData.append('images', image, image.name);
    });

    console.log(this.coordImages)

    formData.append('coords', JSON.stringify(this.coordImages));
  
    return this.nuevaService.uploadImages(routeId, formData).then(() => {
      this.getImages();
      this.errorMessage = '';
      this.successMessage = 'Imagen añadida con éxito';
    })
    .catch((error) => {
      console.error('Error al subir las imágenes:', error);
      this.successMessage = '';
      this.errorMessage = 'Error al subir la imagen';
    });
  }

  /**
   * 
   * Función para eliminar una imagen
   * 
   * @param image Nombre de la imagen
   * 
   * - Almacenar el nombre de la imagen en imageName
   * - Enviar la solicitud a la ruta
   *
   */
  deleteImage (image: string) {
    const imageName = image.split('/').pop() || ''; // 'imagen2.jpg'

    this.editarService.deleteImage(imageName, this.id).subscribe({
      next: (res) => {
        this.errorMessage = '';
        this.successMessage = 'Imagen eliminada con éxito';
        this.getImages();
        this.selectImage(this.slides[0]);
      },
      error: (error) => {
        this.successMessage = '';
        this.errorMessage = 'Ha habido un problema en el borrado';
      }
    });
  }
}

