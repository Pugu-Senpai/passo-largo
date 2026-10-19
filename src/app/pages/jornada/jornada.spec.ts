import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Jornada } from './jornada';

describe('Jornada', () => {
  let component: Jornada;
  let fixture: ComponentFixture<Jornada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Jornada],
    }).compileComponents();

    fixture = TestBed.createComponent(Jornada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
