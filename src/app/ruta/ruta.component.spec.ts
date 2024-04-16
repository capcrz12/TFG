import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutaComponent } from './ruta.component';

describe('RutaComponent', () => {
  let component: RutaComponent;
  let fixture: ComponentFixture<RutaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RutaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RutaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
