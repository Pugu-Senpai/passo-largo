import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaoPerfil } from './cartao-perfil';

describe('CartaoPerfil', () => {
  let component: CartaoPerfil;
  let fixture: ComponentFixture<CartaoPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaoPerfil],
    }).compileComponents();

    fixture = TestBed.createComponent(CartaoPerfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
