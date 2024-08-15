import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { BuscadorService } from './buscador.service';

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.css'
})
export class BuscadorComponent implements OnInit {
  control = new FormControl();
  resultados: any = [];
  
  @Output() resultadosOut: any =  new EventEmitter<number>();

  constructor(private buscadorService : BuscadorService) {}

  ngOnInit(): void {
    this.ObserverChangeSearch()
  }

  ObserverChangeSearch() {
    this.control.valueChanges
    .pipe(
      debounceTime(500)
    ).subscribe(busqueda => (
      this.getData(busqueda)
    ))
  }

  getData(busqueda: string) {
    this.buscadorService.getRoutes(busqueda)
    .subscribe(res => {
      (busqueda != '' ? this.resultados = res : this.resultados = [])
      this.resultadosOut.emit(busqueda);
    })
  }
}
