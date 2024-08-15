import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
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
    if (busqueda != "") {
      this.buscadorService.getRoutes(busqueda)
      .subscribe(res => {
        this.resultados = res;
        console.log(this.resultados);
      })
    }
  }
}
