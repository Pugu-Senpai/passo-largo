import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CabecalhoApp } from './cabecalho-app';

describe('CabecalhoApp', () => {
  let component: CabecalhoApp;
  let fixture: ComponentFixture<CabecalhoApp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabecalhoApp],
    }).compileComponents();

    fixture = TestBed.createComponent(CabecalhoApp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
