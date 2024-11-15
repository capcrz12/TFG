import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MapComponent } from '../map/map.component'; 
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { Dictionary } from '../../dictionary';
import { GraficaComponent } from '../grafica/grafica.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RutaService } from './ruta.service';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { PerfilService } from '../perfil/perfil.service';
import { AccesoService } from '../acceso/acceso.service';

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MapComponent, GraficaComponent, HttpClientModule, SlickCarouselModule],
  templateUrl: './ruta.component.html',
  styleUrl: './ruta.component.css'
})
export class RutaComponent implements OnInit, OnChanges {
  name: string = '';
  @Input() id: string = '';
  routeJSON:any = [];
  rutaId: number;
  pointHovered: number;
  coordsSelected: any;

  dataMap: Dictionary;
  data: Dictionary [];
  gpxData: any;
  elevationProfile: any;
  min: number;
  hour: number;

  idPerfil: number = -1;

  selectedImage: string = "";
  images: any[] = [];

  botonSeguimiento: string = 'Seguir';
  siguiendo: boolean = false;

  observer: IntersectionObserver | undefined;

  slides: string[] = [];     // Array de URLs de las imágenes

  isFullscreen: boolean = false;
  fullscreenImage: string = '';

  constructor(private rutaService:RutaService, private perfilService:PerfilService, private accesoService:AccesoService) {
    this.dataMap = {};
    this.data = [];
    this.rutaId = -1;
    this.pointHovered = -1;
    this.min = 0;
    this.hour = 0;
  }

  /**
   * 
   * Función para inicializar el componente
   * 
   * - Obtener la ruta
   * - Obtener las imágenes
   * 
   */
  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.getRoute();
    this.getImages();

    this.getId();
  }


  ngOnChanges(changes: SimpleChanges): void {
    this.setupIntersectionObserver();
  }

  /**
   * 
   * Función para obtener el ID del perfil
   * 
   */
  getId() {
    this.accesoService.getCurrentUser().subscribe({
      next: (res) => {
        this.idPerfil = res;
        this.checkIfFollowing(); // Llamar a la función cuando se obtiene el idPerfil
      },
      error: (error) => {
        console.error('Error al obtener el idPerfil:', error);
      }
    });
  }

  /**
   * 
   * Función que comprueba si el usuario está autenticado
   * 
   */
  isAuthenticated() {
    return this.accesoService.isAuthenticated();
  }

  /**
   * 
   * Función para comprobar si el usuario está siguiendo al perfil
   *  
   */
  checkIfFollowing() {
    // Verifica si tanto idPerfil como dataMap están disponibles
    if (this.idPerfil !== -1 && this.dataMap['user'] && this.dataMap['user']['id']) {
      this.perfilService.isFollowing(this.idPerfil, this.dataMap['user']['id']).subscribe({
        next: (result: boolean) => {
          this.siguiendo = result;
          this.botonSeguimiento = this.siguiendo ? 'Dejar de seguir' : 'Seguir'; 
        },
        error: (error) => {
          console.error('Error al verificar si sigue al usuario:', error);
          this.siguiendo = false; // En caso de error, establece siguiendo en false
        }
      });
    }
    else {
      console.log('Datos no cargados aún');
    }
  }

  setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Define el umbral de visibilidad al 50%
    };

    // Obtener todos los elementos <p> dentro de #tabla-section
    const paragraphs = document.querySelectorAll('#tabla-seccion p, .column-info p');
  
    // Configurar un observador de intersección para cada <p>
    paragraphs.forEach(p => {
      this.observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Cuando el <p> es visible, aplicar una animación o clase
            p.classList.add('active');
          } else {
            // Cuando el <p> no es visible, revertir la animación o clase
            p.classList.remove('active');
          }
        });
      }, options);

      // Observar el elemento <p> actual
      this.observer!.observe(p);
    });
  }

  onPointHovered(kilometer: any) {
    this.pointHovered = kilometer;
  }
  
  receiveDataMap(dic:Dictionary) {
    this.dataMap = dic;
    this.setupIntersectionObserver();
  }

  receiveElevationProfile(elevationProfile: any) {
    this.elevationProfile = elevationProfile;
  }

  formatTime() {
    this.hour = Math.floor(this.dataMap['estimated_time'])
    this.min = Math.round((this.dataMap['estimated_time'] - this.hour) * 60);
  }

  /**
   * 
   * Función para cambiar el estado de siguiendo
   * 
   */
  botonSeguir() {
    this.siguiendo = !this.siguiendo;
    this.botonSeguimiento = this.siguiendo ? 'Dejar de seguir' : 'Seguir';

    if (this.siguiendo) {
      this.follow();
    } else {
      this.unfollow();
    }
  }

  /**
   * 
   * Función para seguir al perfil
   *  
   */ 
  follow() {
    this.perfilService.follow(this.idPerfil, this.dataMap['user']['id']).subscribe({
      next: () => {
        console.log('Has empezado a seguir al usuario.');
      },
      error: (error) => {
        console.error('Error al seguir al usuario:', error);
        // En caso de error, revertir el estado a no seguir
        this.siguiendo = false;
        this.botonSeguimiento = 'Seguir';
      }
    });
  }

  /**
   * 
   * Función para dejar de seguir al perfil
   *  
   */
  unfollow() {
    this.perfilService.unfollow(this.idPerfil, this.dataMap['user']['id']).subscribe({
      next: () => {
        console.log('Has dejado de seguir al usuario.');
      },
      error: (error) => {
        console.error('Error al dejar de seguir al usuario:', error);
        // En caso de error, revertir el estado a seguir
        this.siguiendo = true;
        this.botonSeguimiento = 'Dejar de seguir';
      }
    });
  }

  /**
   * 
   * Función para obtener la ruta
   * 
   */ 
  getRoute(): void {
    this.rutaService.getData(this.id).subscribe({
      next: (data) => {
        this.routeJSON = data.routeJSON;
        this.gpxData = data.gpxData;
        this.dataMap = data.dataMap;
        this.formatTime();

        this.checkIfFollowing();
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
    this.rutaService.getRouteImages(this.id).subscribe({
      next: (images: any) => {
        images.forEach((image:any) => {
          this.slides.push(image.filename);  // Asigna las URLs de las imágenes
        })
        this.images = images;
      },
      error: (error) => {
        console.error('Error al cargar las imágenes:', error);
      }
    });
  }

  slideConfig = {"slidesToShow": 3, "slidesToScroll": 1};
  
  selectImage(img: string) {
    this.selectedImage = img;
    this.coordsSelected = this.images.find((img) => img['filename'] == this.selectedImage);
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

  openFullscreen(imageSrc: string) {
    this.isFullscreen = true;
    this.fullscreenImage = imageSrc;
  }

  // Cerrar la imagen en pantalla completa
  closeFullscreen(event?: MouseEvent) {
    if (event) {
      event.stopPropagation(); // Evitar que se cierre al hacer clic en la imagen
    }
    this.isFullscreen = false;
    this.fullscreenImage = '';
  }
}

