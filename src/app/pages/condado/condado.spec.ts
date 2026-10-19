import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Condado } from './condado';

describe('Condado', () => {
  let component: Condado;
  let fixture: ComponentFixture<Condado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Condado],
    }).compileComponents();

    fixture = TestBed.createComponent(Condado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
