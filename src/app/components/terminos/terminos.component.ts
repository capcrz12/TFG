import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common'; 
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [],
  templateUrl: './terminos.component.html',
  styleUrl: './terminos.component.css'
})
export class TerminosComponent {

  url: string;
  baseURL = window.location.protocol + "//" + window.location.host + "/";
  privacy: string = `${this.baseURL}privacy-policy`;
  service: string = `${this.baseURL}terms-of-service`;
  data: string = `${this.baseURL}data-usage`;

  constructor(@Inject(DOCUMENT) document: any) {
    this.url = document.location.href;
  }
}
