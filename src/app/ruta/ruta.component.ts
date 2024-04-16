import { Component, Input } from '@angular/core';
import { MapComponent } from '../map/map.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [RouterOutlet, MapComponent],
  templateUrl: './ruta.component.html',
  styleUrl: './ruta.component.css'
})
export class RutaComponent {
  @Input() name = '';
}
