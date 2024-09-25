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

  ObserverChangeRouteSearch() {
    this.control.valueChanges
    .pipe(
      debounceTime(500)
    ).subscribe(busqueda => (
      this.getRoutes(busqueda)
    ))
  }

  ObserverChangeUserSearch() {
    this.control.valueChanges
    .pipe(
      debounceTime(500)
    ).subscribe(busqueda => (
      this.getUsers(busqueda)
    ))
  }

  getRoutes(busqueda: string) {
    this.buscadorService.getRoutes(busqueda)
    .subscribe(res => {
      (busqueda != '' ? this.resultados = res : this.resultados = [])
      this.resultadosOut.emit(busqueda);
    })
  }

  getUsers(busqueda: string) {
    this.buscadorService.getUsers(busqueda)
    .subscribe(res => {
      (busqueda != '' ? this.resultados = res : this.resultados = [])
      console.log(this.resultados)
    })
  }
}
