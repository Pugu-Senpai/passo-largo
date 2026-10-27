import {
  Component, ElementRef, HostListener, Injector, Input, OnChanges, OnDestroy, OnInit,
  ViewChild, afterNextRender, inject, signal
} from '@angular/core';
import { ArmazenamentoService } from '../../services/armazenamento.service';

type Modo = 'musica' | 'video';

@Component({
  selector: 'app-musica-jornada',
  imports: [],
  templateUrl: './musica-jornada.html',
  styleUrl: './musica-jornada.css'
})
export class MusicaJornada implements OnInit, OnChanges, OnDestroy {
  @Input() pausado = false;

  @ViewChild('audio') audio?: ElementRef<HTMLAudioElement>;

  private readonly CHAVE_SOM = 'pl_som';
  private readonly CHAVE_CONTADOR = 'pl_sessoes_ate_video';

  private readonly armazenamento = inject(ArmazenamentoService);
  private readonly injector = inject(Injector);

  readonly somLigado = signal(true);
  readonly modo = signal<Modo>('musica');
  readonly janelaAberta = signal(false);

  ngOnInit(): void {
    this.somLigado.set(this.armazenamento.ler<string>(this.CHAVE_SOM, 'ligado') !== 'desligado');
    if (!this.somLigado()) {
      return;
    }

    if (this.calhaVideo()) {
      this.modo.set('video');
      this.janelaAberta.set(true);
    } else {
      afterNextRender(() => this.tocarMusica(), { injector: this.injector });
    }
  }

  ngOnChanges(): void {
    if (!this.somLigado() || this.modo() !== 'musica') {
      return;
    }
    if (this.pausado) {
      this.audio?.nativeElement.pause();
    } else {
      this.tocarMusica();
    }
  }

  ngOnDestroy(): void {
    this.audio?.nativeElement.pause();
  }

  // ===== Botões =====

  alternarSom(): void {
    if (this.somLigado()) {
      this.desligarSom();
    } else {
      this.armazenamento.guardar(this.CHAVE_SOM, 'ligado');
      this.somLigado.set(true);
      this.modo.set('musica');
      this.tocarMusica();
    }
  }

  desligarSom(): void {
    this.armazenamento.guardar(this.CHAVE_SOM, 'desligado');
    this.audio?.nativeElement.pause();
    this.somLigado.set(false);
    this.modo.set('musica');
    this.janelaAberta.set(false);
  }

  minimizar(): void {
    this.janelaAberta.set(false);
  }

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    if (this.janelaAberta()) {
      this.minimizar();
    }
  }

  // ===== Auxiliares =====

  private tocarMusica(): void {
    const audio = this.audio?.nativeElement;
    if (!audio) {
      return;
    }
    audio.volume = 0.35;
    audio.play().catch(() => {
      this.somLigado.set(false);
    });
  }

  private calhaVideo(): boolean {
    const lido = this.armazenamento.ler<number>(this.CHAVE_CONTADOR, 0);
    const faltam = Number.isInteger(lido) && lido >= 1 && lido <= 10 ? lido : this.sortearIntervalo();

    if (faltam <= 1) {
      this.armazenamento.guardar(this.CHAVE_CONTADOR, this.sortearIntervalo());
      return true;
    }
    this.armazenamento.guardar(this.CHAVE_CONTADOR, faltam - 1);
    return false;
  }

  private sortearIntervalo(): number {
    return 5 + Math.floor(Math.random() * 6);
  }
}
