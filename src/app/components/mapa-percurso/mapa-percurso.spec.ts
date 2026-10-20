import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapaPercurso } from './mapa-percurso';

describe('MapaPercurso', () => {
  let component: MapaPercurso;
  let fixture: ComponentFixture<MapaPercurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaPercurso],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaPercurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
