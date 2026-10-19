import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoPerfil } from './novo-perfil';

describe('NovoPerfil', () => {
  let component: NovoPerfil;
  let fixture: ComponentFixture<NovoPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoPerfil],
    }).compileComponents();

    fixture = TestBed.createComponent(NovoPerfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
