import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExercicioDetalhe } from './exercicio-detalhe';

describe('ExercicioDetalhe', () => {
  let component: ExercicioDetalhe;
  let fixture: ComponentFixture<ExercicioDetalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExercicioDetalhe],
    }).compileComponents();

    fixture = TestBed.createComponent(ExercicioDetalhe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
