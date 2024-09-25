import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSeguidoresComponent } from './modal-seguidores.component';

describe('ModalSeguidoresComponent', () => {
  let component: ModalSeguidoresComponent;
  let fixture: ComponentFixture<ModalSeguidoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSeguidoresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalSeguidoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
