import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelecaoPerfil } from './selecao-perfil';

describe('SelecaoPerfil', () => {
  let component: SelecaoPerfil;
  let fixture: ComponentFixture<SelecaoPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelecaoPerfil],
    }).compileComponents();

    fixture = TestBed.createComponent(SelecaoPerfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
