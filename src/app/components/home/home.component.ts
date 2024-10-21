import { Component, OnInit, AfterViewInit, Output, Input } from '@angular/core';
import { Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { MapComponent } from '../map/map.component'; 
import { CommonModule } from '@angular/common';
import { Dictionary } from '../../dictionary'; 
import { HomeService } from './home.service';
import { BuscadorComponent } from '../buscador/buscador.component'; 
import { AccesoService } from '../acceso/acceso.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapComponent, RouterLink, RouterModule, BuscadorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  name: string;
  siguiendo: boolean;
  isFilterOpen: boolean = false;
  routesSiguiendo:any = [];
  routesExplorar:any = [];

  message: string = '';
 
  type:number;
  gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  coordinates: any;
  bounds: any;
  dataMapSiguiendo:Dictionary[] = [];
  dataMapExplorar:Dictionary[] = [];


  dataLoaded: boolean = false;

  filters: any = [];  // Añadir propiedad para almacenar filtros
  filterName: any = [];
  filterCriteria: any;

  constructor(private router: Router,private homeService: HomeService, private accesoService: AccesoService) {
    this.name = ''
    this.siguiendo = false;  // Al cargar home aparece en siguiendo si es true, y en explorar si es false

    this.type = 0;   
  }

  /**
   * 
   * Función para inicializar el componente
   * 
   * - Suscribirse a los cambios de autenticación
   * - Si el usuario está autenticado, se muestra el componente en siguiendo
   * - Si el usuario no está autenticado, se muestra el componente en explorar
   *
   */
  ngOnInit(): void{
    // Suscribirse a los cambios de autenticación
    this.accesoService.getAuthStatus().subscribe((isAuthenticated) => {
      this.siguiendo = isAuthenticated;
      this.getDataSiguiendo();
      this.getDataExplorar();
    });

    this.isAuthenticated() ? this.siguiendo = true : this.siguiendo = false;

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.message = navigation.extras.state['message'];  // Recibir el mensaje del estado
    }

    if (this.message) {
      setTimeout(() => {
        this.message = '';  // Limpiar el mensaje después de 5 segundos
      }, 3000);
    }
  }

  ngAfterViewInit() {
  }
  
  /**
   * 
   * Función que scrollea a la parte superior de la pantalla
   * 
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * 
   * Función para cambiar el estado de siguiendo
   *
   * @param value Estado de siguiendo
   * 
   */
  setSiguiendo(value: boolean): void {
    this.siguiendo = value;
    if (this.siguiendo == true)
      this.getDataSiguiendo();
  }

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  /**
   * 
   * Función para aplicar el filtro de nombre y ubicación de la barra de busqueda
   * 
   * - Comprueba si el nombre o la ubicación de las rutas incluyen la cadena filter
   * - Actualiza el filtro de Maplibre
   * 
   * @param filter Cadena de filtro
   *
   */
  onFilterApplied(filter: any) {
    this.filterCriteria = filter;
    if (filter != '') {
      this.filterName = [
        'any', // Al menos una de las condiciones debe cumplirse
        ['>', ['index-of', filter.toLowerCase(), ['downcase' , ['to-string', ['get', 'name']]]], -1],
        ['>', ['index-of', filter.toLowerCase(), ['downcase' , ['to-string', ['get', 'ubication']]]], -1],
      ];
    }
    else {
      this.filterName = ['==', 1, 1]; // Siempre se cumple
    }
  }
  

  /**
   * 
   * Función para aplicar los filtros
   * 
   * - Obtiene los filtros desde el HTML
   * - Actualiza el filtro de Maplibre
   * 
   */
  applyFilter() {
    // Lógica para obtener los filtros desde el HTML
    const kmCheckbox = (document.getElementById('km') as HTMLInputElement).checked;
    const kmOperator = (document.getElementById('operator-km') as HTMLSelectElement).value;
    const kmValue = parseFloat((document.getElementById('range-km') as HTMLInputElement).value);

    const timeCheckbox = (document.getElementById('time') as HTMLInputElement).checked;
    const timeOperator = (document.getElementById('operator-time') as HTMLSelectElement).value;
    const timeValue = parseFloat((document.getElementById('range-time') as HTMLInputElement).value);

    const posCheckbox = (document.getElementById('pos') as HTMLInputElement).checked;
    const posOperator = (document.getElementById('operator-pos') as HTMLSelectElement).value;
    const posValue = parseFloat((document.getElementById('range-pos') as HTMLInputElement).value);

    const negCheckbox = (document.getElementById('neg') as HTMLInputElement).checked;
    const negOperator = (document.getElementById('operator-neg') as HTMLSelectElement).value;
    const negValue = parseFloat((document.getElementById('range-neg') as HTMLInputElement).value);

    // Transformar los filtros a la especificación de Maplibre
    this.filters = [
      'all', // Esto indica que todas las condiciones deben cumplirse
      ...(kmCheckbox ? [this.createFilterExpression('km', kmOperator, kmValue)] : []),
      ...(timeCheckbox ? [this.createFilterExpression('estimated_time', timeOperator, timeValue)] : []),
      ...(posCheckbox ? [this.createFilterExpression('pos_desnivel', posOperator, posValue)] : []),
      ...(negCheckbox ? [this.createFilterExpression('neg_desnivel', negOperator, negValue)] : []),
    ];  
  }

  /**
   * 
   * Función para crear un filtro de Maplibre
   * 
   * @param property Propiedad del filtro
   * @param operator Operador del filtro
   * @param value Valor del filtro
   * 
   * @returns Filtro de Maplibre
   * 
   */
  createFilterExpression(property: string, operator: string, value: number) {
    switch (operator) {
      case '>':
        return ['>', ['get', property], value];
      case '<':
        return ['<', ['get', property], value];
      case '==':
        return ['==', ['get', property], value];
      default:
        return ['==', ['get', property], value]; // Valor por defecto
    }
  }

  /**
   * 
   * Función para comprobar si el usuario está autenticado
   * 
   * @returns boolean
   * 
   */
  isAuthenticated () {
    return this.accesoService.isAuthenticated();
  }

  /**
   * 
   * Función para obtener los datos de las rutas siguiendo
   * 
   * - Obtiene el ID del usuario actual
   * - Obtiene los datos de las rutas siguiendo
   * - Obtiene los datos de GPX
   * - Obtiene los datos de mapa
   * 
   */
  getDataSiguiendo() {
    this.accesoService.getCurrentUser().subscribe((id) => {
      this.homeService.getRoutesSiguiendo(id).subscribe((res) => {
        this.routesSiguiendo = res;
        this.homeService.getGPXData(this.routesSiguiendo).then((gpxData) => {
          this.dataMapSiguiendo = this.homeService.getDataMap(this.routesSiguiendo, gpxData);
          this.dataLoaded = true;
        }).catch(error => {
          console.error('Error:', error);
        });
      });
    });
  }

  /**
   * 
   * Función para obtener los datos de las rutas explorar
   * 
   * - Obtiene los datos de las rutas explorar
   * - Obtiene los datos de GPX
   * - Obtiene los datos de mapa
   *
   */
  getDataExplorar() {
    this.homeService.getRoutesExplorar().subscribe((res) => {
      this.routesExplorar = res;
      this.homeService.getGPXData(this.routesExplorar).then((gpxData) => {
        this.dataMapExplorar = this.homeService.getDataMap(this.routesExplorar, gpxData);
        this.dataLoaded = true;
      }).catch(error => {
        console.error('Error:', error);
      });
    });
  }
}
