import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common'; 

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [],
  templateUrl: './terminos.component.html',
  styleUrl: './terminos.component.css'
})
export class TerminosComponent {

  url: string;
  privacy: string = "http://localhost:4200/privacy-policy";
  service: string = "http://localhost:4200/terms-of-service";
  data: string = "http://localhost:4200/data-usage";

  constructor(@Inject(DOCUMENT) document: any) {
    this.url = document.location.href;
    }
}
