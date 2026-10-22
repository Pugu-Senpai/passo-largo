import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Marco } from '../models/marco.model';
import { Exercicio } from '../models/exercicio.model';

@Injectable({ providedIn: 'root' })
export class DadosService {
  private readonly BASE = 'dados';
  private readonly exercicios$: Observable<Exercicio[]>;
  private readonly marcos$: Observable<Marco[]>;

  constructor(private http: HttpClient) {
    this.exercicios$ = this.http
      .get<Exercicio[]>(`${this.BASE}/exercicios.json`)
      .pipe(shareReplay(1));

    this.marcos$ = this.http
      .get<Marco[]>(`${this.BASE}/marcos.json`)
      .pipe(shareReplay(1));
  }

  obterMarcos(): Observable<Marco[]> {
    return this.marcos$;
  }

  obterExercicios(): Observable<Exercicio[]> {
    return this.exercicios$;
  }

  obterExercicio(id: number): Observable<Exercicio | undefined> {
    return this.obterExercicios().pipe(
      map(lista => lista.find(e => e.id === id))
    );
  }
}