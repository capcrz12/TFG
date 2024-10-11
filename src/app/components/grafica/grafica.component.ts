import { AfterViewInit, Component, Input, OnChanges, Output, SimpleChanges, EventEmitter, OnInit } from '@angular/core';
import { Chart, LinearScale, CategoryScale, LineController, LineElement, PointElement } from 'chart.js';

@Component({
  selector: 'app-grafica',
  standalone: true,
  imports: [],
  templateUrl: './grafica.component.html',
  styleUrl: './grafica.component.css'
})
export class GraficaComponent implements AfterViewInit, OnChanges, OnInit {
  chart: Chart | undefined;
  ctx: any;
  intervalo: number = 0.5;
  ejeX: number[];
  @Input() elevationProfile: { kilometers: number[], altitudes: number[] } = { kilometers: [], altitudes: [] };


  @Input() gpxData: { kilometers: number[], altitudes: number[] };
  @Output() pointHovered = new EventEmitter<number>();

  highlightedPoint: { x: number, y: number } = {x: 0, y: 0};

  constructor() {
    Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement);
    this.ejeX = [];
    this.gpxData = { kilometers: [], altitudes: [] };
  }

  ngOnInit(): void {
  }


  /**
   * 
   * Función para inicializar el gráfico
   * 
   * - Inicializar el gráfico
   * - Configurar el evento de mousemove
   * - Actualizar el gráfico
   *
   */
  ngAfterViewInit(): void {
    this.ctx = document.getElementById('myChart');
    this.initializeChart();
    this.setupMouseMoveListener();
    this.updateChart();
  }

  /**
   * 
   * Función para actualizar el gráfico
   * 
   * @param changes Objeto con los cambios en las propiedades
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['elevationProfile'] && !changes['elevationProfile'].firstChange) {
      this.updateChart();

      for (let i = 0; i <= this.elevationProfile.kilometers[this.elevationProfile.kilometers.length-1]; i += this.intervalo) {
          this.ejeX.push(i); // Redondea a 1 decimal
      }
    }
  }
  
  /**
   *  
   * Función para inicializar el gráfico
   * 
   */
  initializeChart(): void {
    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Altitud',
          data: [],
          borderWidth: 2,
          borderColor: 'red',
          pointStyle: false,
        },
        {
          label: 'Highlighted Point',
          data: [],
          borderColor: 'black',
          backgroundColor: 'white',
          pointRadius: 5, // Tamaño del punto
          pointHoverRadius: 5, // Tamaño del punto al pasar el ratón
          pointStyle: 'crossRot', // Forma del punto
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Altitud (m)',
            }
          },
          x: {
            title: {
              display: true,
              text: 'Kilómetros',
            },
            ticks: {
              maxTicksLimit: 15
            }
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  /**
   * 
   * Función para configurar el evento de mousemove
   * 
   * - Configurar el evento de mousemove
   *  
   */
  setupMouseMoveListener(): void {
    this.ctx.addEventListener('mousemove', (event: MouseEvent) => {
      const points = this.chart!.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true);
      if (points.length) {
        const firstPoint = points[0];
        const index = firstPoint.index;
        const kilometer = this.elevationProfile.kilometers[index];
        this.pointHovered.emit(kilometer);
        this.highlightedPoint = { x: kilometer, y: this.elevationProfile.altitudes[index] };
        this.updateHighlightedPoint();
      }
    });
  }

  /**
   * 
   * Función para actualizar el punto resaltado
   *
   */
  updateHighlightedPoint(): void {
    if (this.chart && this.highlightedPoint) {
      const highlightedDataset = this.chart.data.datasets.find(dataset => dataset.label === 'Highlighted Point');
      if (highlightedDataset) {
        highlightedDataset.data = [this.highlightedPoint];
        this.chart.update();
      }
    }
  }
  
  /**
   *  
   * Función para actualizar el gráfico
   * 
   */
  updateChart(): void {
    if (this.chart) {
      this.chart.data.labels = this.elevationProfile.kilometers;
      this.chart.data.datasets[0].data = this.elevationProfile.altitudes;
      this.chart.update();
    }
  }
}
