import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, defer, map, shareReplay, switchMap, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';
import { Exercicio } from '../models/exercicio.model';
import { Marco } from '../models/marco.model';

interface LinhaExercicio {
  id: number;
  nome: string;
  tipo: Exercicio['tipo'];
  zona: Exercicio['zona'];
  niveis: Exercicio['niveis'];
  intensidade: Exercicio['intensidade'] | null;
  equipamento: Exercicio['equipamento'];
  musculos: string[];
  passos: string[];
  series: number;
  repeticoes: number | null;
  duracao_segundos: number | null;
  video: string | null;
}

interface LinhaMarco {
  id: number;
  nome: string;
  km: number;
  descricao: string;
  icone: string;
  posicao: number;
}

const COLUNAS_EXERCICIO =
  'id, nome, tipo, zona, niveis, intensidade, equipamento, musculos, passos, series, repeticoes, duracao_segundos, video';

const COLUNAS_MARCO = 'id, nome, km, descricao, icone, posicao';

@Injectable({ providedIn: 'root' })
export class DadosService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  private readonly urlApi = `${environment.supabaseUrl}/rest/v1`;

  private readonly exercicios$: Observable<Exercicio[]> =
    this.pedir<LinhaExercicio>('exercicios', COLUNAS_EXERCICIO, 'id').pipe(
      map(linhas => linhas.map(paraExercicio)),
      shareReplay(1)
    );

  private readonly marcos$: Observable<Marco[]> =
    this.pedir<LinhaMarco>('marcos', COLUNAS_MARCO, 'km').pipe(
      map(linhas => linhas.map(paraMarco)),
      shareReplay(1)
    );

  obterExercicios(): Observable<Exercicio[]> {
    return this.exercicios$;
  }

  obterMarcos(): Observable<Marco[]> {
    return this.marcos$;
  }

  obterExercicio(id: number): Observable<Exercicio | undefined> {
    return this.exercicios$.pipe(map((lista) => lista.find((e) => e.id === id)));
  }

  private pedir<T>(tabela: string, colunas: string, ordem: string): Observable<T[]> {
    return defer(() => this.cabecalhos()).pipe(
      switchMap(headers =>
        this.http.get<T[]>(`${this.urlApi}/${tabela}`, {
          headers,
          params: { select: colunas.replace(/\s/g, ''), order: `${ordem}.asc` },
        })
      ),
      catchError((erro: unknown) => {
        const detalhe = erro instanceof HttpErrorResponse ? erro.status : (erro as Error).message;
        console.error(`Erro ao carregar ${tabela}:`, detalhe);
        return throwError(() => new Error(`Não foi possível carregar os dados (${tabela}).`));
      })
    );
  }

  private async cabecalhos(): Promise<HttpHeaders> {
    const { data } = await this.supabase.cliente.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error('Sem sessão iniciada');
    }
    return new HttpHeaders({
      apikey: environment.supabaseKey,
      Authorization: `Bearer ${token}`,
    });
  }
}

function paraExercicio(linha: LinhaExercicio): Exercicio {
  return {
    id: linha.id,
    nome: linha.nome,
    tipo: linha.tipo,
    zona: linha.zona,
    niveis: linha.niveis,
    intensidade: linha.intensidade ?? undefined,
    equipamento: linha.equipamento,
    musculos: linha.musculos,
    passos: linha.passos,
    series: linha.series,
    repeticoes: linha.repeticoes ?? undefined,
    duracaoSegundos: linha.duracao_segundos ?? undefined,
    video: linha.video ?? undefined,
  };
}

function paraMarco(linha: LinhaMarco): Marco {
  return {
    id: linha.id,
    nome: linha.nome,
    km: Number(linha.km),
    descricao: linha.descricao,
    icone: linha.icone,
    posicao: Number(linha.posicao),
  };
}