import { Component, OnInit, AfterViewInit, Output, Input } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { MapComponent } from '../map/map.component';
import { CommonModule } from '@angular/common';
import { Dictionary } from '../dictionary'; 
import { HomeService } from './home.service';
import { BuscadorComponent } from '../buscador/buscador.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MapComponent, RouterLink, RouterModule, BuscadorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  name: string;
  user: string;
  siguiendo: boolean;
  isFilterOpen: boolean = false;
  routes:any = [];
 
  type:number;
  gpxData: any; // Declaración de la propiedad gpxData para almacenar datos de GPX
  coordinates: any;
  bounds: any;
  dataMap:Dictionary[] = [];

  filters: any = [];  // Añadir propiedad para almacenar filtros

  constructor(private homeService: HomeService) {
    this.name = 'Ruta de prueba'
    this.user = 'Carlos Pérez'
    this.siguiendo = false;

    this.type = 0;   
  }

  ngOnInit(): void{
    this.getData();
  }

  ngAfterViewInit() {

  }
  
  // Funcion que scrollea a la parte superior de la pantalla
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  setSiguiendo(value: boolean): void {
    this.siguiendo = value;
  }

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  applyFilter() {
    // Lógica para obtener los filtros desde el HTML
    const kmCheckbox = (document.getElementById('km') as HTMLInputElement).checked;
    const kmOperator = (document.getElementById('operator-km') as HTMLSelectElement).value;
    const kmValue = parseFloat((document.getElementById('range-km') as HTMLInputElement).value);

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
      ...(posCheckbox ? [this.createFilterExpression('des_pos', posOperator, posValue)] : []),
      ...(negCheckbox ? [this.createFilterExpression('des_neg', negOperator, negValue)] : []),
    ];  
      console.log(this.filters);
  }

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

  getData() {
    this.homeService.getRoutes().subscribe((res) => {
      this.routes = res;
      this.homeService.getGPXData(this.routes).then((gpxData) => {
        this.dataMap = this.homeService.getDataMap(this.routes, gpxData);
      }).catch(error => {
        console.error('Error:', error);
      });
    });
  }
}
