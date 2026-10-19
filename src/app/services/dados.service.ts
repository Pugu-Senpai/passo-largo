import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marco } from '../models/marco.model';

@Injectable({ providedIn: 'root' })
export class DadosService {
  private readonly BASE = 'dados';

  constructor(private http: HttpClient) {}

  obterMarcos(): Observable<Marco[]> {
    return this.http.get<Marco[]>(`${this.BASE}/marcos.json`);
  }
}