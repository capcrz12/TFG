import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { BuscadorService } from './buscador.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.css'
})
export class BuscadorComponent implements OnInit {
  control = new FormControl();
  resultados: any = [];
  placeholder: string = 'Buscar caminos . . .';

  @Input() isRouteSearch: boolean = true; // Si falso, busca usuarios
  
  @Output() resultadosOut: any =  new EventEmitter<number>();

  constructor(private buscadorService : BuscadorService) {}

  /**
   * 
   *  Función para inicializar el componente
   * 
   *  - Si es una búsqueda de rutas, se inicializa la búsqueda de rutas
   *  - Si es una búsqueda de usuarios, se inicializa la búsqueda de usuarios
   *  
   */
  ngOnInit(): void {
    if (this.isRouteSearch) {
      this.ObserverChangeRouteSearch();
      this.placeholder = 'Buscar caminos . . .';
    }
    else {
      this.ObserverChangeUserSearch();
      this.placeholder = 'Buscar usuarios . . .';
    }
  }

  /**
   * 
   *  Función para inicializar la búsqueda de rutas
   * 
   *  - Se inicializa la búsqueda de rutas
   *  - Se emite el evento resultadosOut
   *
   */
  ObserverChangeRouteSearch() {
    this.control.valueChanges
    .pipe(
      debounceTime(500)
    ).subscribe(busqueda => (
      this.getRoutes(busqueda)
    ))
  }

  /**
   *  Función para inicializar la búsqueda de usuarios
   * 
   *  - Se inicializa la búsqueda de usuarios
   *  - Se emite el evento resultadosOut
   *
   */
  ObserverChangeUserSearch() {
    this.control.valueChanges
    .pipe(
      debounceTime(500)
    ).subscribe(busqueda => (
      this.getUsers(busqueda)
    ))
  }

  /**
   * 
   * Función para buscar rutas
   * 
   * @param busqueda Cadena de búsqueda
   *  
   */
  getRoutes(busqueda: string) {
    this.buscadorService.getRoutes(busqueda)
    .subscribe(res => {
      (busqueda != '' ? this.resultados = res : this.resultados = [])
      this.resultadosOut.emit(busqueda);
    })
  }

  /**
   * 
   * Función para buscar usuarios
   * 
   * @param busqueda 
   * 
   */
  getUsers(busqueda: string) {
    this.buscadorService.getUsers(busqueda)
    .subscribe({
      next: (res) => {
      (busqueda != '' ? this.resultados = res : this.resultados = [])
      console.log(this.resultados)
      },
      error: () => {
        this.resultados = [];
      }
    })
  }
}
