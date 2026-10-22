import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Definicoes } from './definicoes';

describe('Definicoes', () => {
  let component: Definicoes;
  let fixture: ComponentFixture<Definicoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Definicoes],
    }).compileComponents();

    fixture = TestBed.createComponent(Definicoes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
