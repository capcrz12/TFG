import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { calculateAverageSpeed, calculateEstimatedTime, calculateMaxAltitude, calculateMinAltitude, calculateNegativeElevationLoss, calculatePositiveElevationGain, calculateTotalDistance, cargarGPX } from '../../utils/map';
import { gpx } from "@tmcw/togeojson";
import { MapComponent } from "../map/map.component";
import { Dictionary } from '../../dictionary';
import { RutaService } from '../ruta/ruta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EditarRutaService } from './editar-ruta.service';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { NuevaRutaService } from '../nueva-ruta/nueva-ruta.service';

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

  getImages(): void {
    this.rutaService.getRouteImages(String(this.id)).subscribe({
      next: (images: string[]) => {
        this.slides = images;  // Asigna las URLs de las imágenes
      },
      error: (error) => {
        console.error('Error al cargar las imágenes:', error);
      }
    });
  }
  
  formatTime() {
    this.hour = Math.floor(this.dataMap['estimated_time'])
    this.min = Math.round((this.dataMap['estimated_time'] - this.hour) * 60);
  }

  updateEstimatedTime() {
    let km:number, speed :number;
    this.ruta['km'] ? km = this.ruta['km'] : km = this.dataMap['km'];
    this.ruta['speed'] ? speed = this.ruta['speed'] : speed = this.dataMap['speed'];


    this.ruta['estimated_time'] = calculateEstimatedTime(km, speed);

    this.hour = Math.floor(this.ruta['estimated_time']); 
    this.min = Math.round((this.ruta['estimated_time'] - this.hour) * 60);
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

  subirRuta () {
    for (const key in this.dataMap) {
      if (this.dataMap.hasOwnProperty(key)) {
        // Si la clave no existe en ruta, la añadimos
        if (!(key in this.ruta)) {
          this.ruta[key] = this.dataMap[key];  // Copiar el valor de dataMap a ruta
        }
      }
    }

    this.editarService.updateRoute(this.ruta, this.idPerfil);   // Se pasa idPerfil para poder navegar al perfil una vez actualizada la ruta
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

  async onImagesSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedImages = Array.from(event.target.files);

      await this.uploadImages(this.id);
    }
  }

  uploadImages(routeId: number) {
    const formData = new FormData();
    this.selectedImages.forEach((image, index) => {
      formData.append('images', image, image.name);
    });
  
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

