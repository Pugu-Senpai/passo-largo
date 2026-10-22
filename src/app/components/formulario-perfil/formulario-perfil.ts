import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NovoUtilizador } from '../../services/utilizador.service';
import { Utilizador } from '../../models/utilizador.model';
import { NivelFisico, Genero } from '../../models/tipos';
import { AVATARES, AVATAR_PADRAO, caminhoAvatar } from '../../models/avatares';

@Component({
  selector: 'app-formulario-perfil',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-perfil.html',
  styleUrl: './formulario-perfil.css'
})
export class FormularioPerfil implements OnInit {
  @Input() valoresIniciais?: Utilizador;
  @Input() textoBotao = 'Guardar';

  @Output() submetido = new EventEmitter<NovoUtilizador>();
  @Output() cancelado = new EventEmitter<void>();

  seletorAberto = false;

  @ViewChild('zonaAvatar') zonaAvatar?: ElementRef<HTMLElement>;
  @ViewChild('formulario') formulario?: ElementRef<HTMLFormElement>;

  niveis: { valor: NivelFisico; rotulo: string }[] = [
    { valor: 'sedentario', rotulo: 'Sedentário' },
    { valor: 'pouco-ativo', rotulo: 'Pouco ativo' },
    { valor: 'ativo', rotulo: 'Ativo' },
    { valor: 'muito-ativo', rotulo: 'Muito ativo' }
  ];

  generos: { valor: Genero; rotulo: string }[] = [
    { valor: 'masculino', rotulo: 'Masculino' },
    { valor: 'feminino', rotulo: 'Feminino' },
    { valor: 'nao-dizer', rotulo: 'Prefiro não dizer' }
  ];

  readonly avatares = AVATARES;
  readonly caminhoAvatar = caminhoAvatar;

  form = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(20)]
    }),
    genero: new FormControl<Genero | null>(null, Validators.required),
    avatar: new FormControl(AVATAR_PADRAO, { nonNullable: true }),
    idade: new FormControl<number | null>(null, [Validators.required, Validators.min(16), Validators.max(100)]),
    peso: new FormControl<number | null>(null, [Validators.required, Validators.min(30), Validators.max(300)]),
    altura: new FormControl<number | null>(null, [Validators.required, Validators.min(100), Validators.max(250)]),
    temKettlebell: new FormControl(false, { nonNullable: true }),
    nivelFisico: new FormControl<NivelFisico | null>(null, Validators.required),
    diasDescansoSemana: new FormControl<1 | 2>(1, { nonNullable: true })
  });

  ngOnInit(): void {
    if (this.valoresIniciais) {
      this.form.patchValue(this.valoresIniciais);
    }
  }

  campoInvalido(campo: keyof typeof this.form.controls): boolean {
    const controlo = this.form.controls[campo];
    return controlo.invalid && (controlo.touched || controlo.dirty);
  }

  submeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => {
        const primeiro = this.formulario?.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]');
        primeiro?.focus();
      });
      return;
    }
    const valores = this.form.getRawValue();
    this.submetido.emit({
      nome: valores.nome.trim(),
      genero: valores.genero!,
      avatar: valores.avatar,
      idade: valores.idade!,
      peso: valores.peso!,
      altura: valores.altura!,
      temKettlebell: valores.temKettlebell,
      nivelFisico: valores.nivelFisico!,
      diasDescansoSemana: valores.diasDescansoSemana
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  alternarSeletor(): void {
    this.seletorAberto = !this.seletorAberto;
  }

  escolherAvatar(): void {
    this.seletorAberto = false;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:focusin', ['$event'])
  aoInteragirFora(evento: Event): void {
    const zona = this.zonaAvatar?.nativeElement;
    if (this.seletorAberto && zona && !zona.contains(evento.target as Node)) {
      this.seletorAberto = false;
    }
  }

  @HostListener('document:keydown.escape')
  aoCarregarEscape(): void {
    this.seletorAberto = false;
  }
}