import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaoExercicio } from './cartao-exercicio';

describe('CartaoExercicio', () => {
  let component: CartaoExercicio;
  let fixture: ComponentFixture<CartaoExercicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaoExercicio],
    }).compileComponents();

    fixture = TestBed.createComponent(CartaoExercicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
