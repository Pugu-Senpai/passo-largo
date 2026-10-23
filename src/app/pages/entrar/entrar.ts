import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule, FormGroup, FormControl, Validators,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';

type Modo = 'entrar' | 'registar';

const PASSWORD_FORTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function passwordsIguais(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return password && confirmar && password !== confirmar ? { diferentes: true } : null;
}

@Component({
  selector: 'app-entrar',
  imports: [ReactiveFormsModule],
  templateUrl: './entrar.html',
  styleUrl: './entrar.css'
})
export class Entrar {
  readonly modo = signal<Modo>('entrar');
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly mensagem = signal<string | null>(null);
  readonly mostrarPassword = signal(false);

  @ViewChild('formulario') formulario?: ElementRef<HTMLFormElement>;

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)]
    }),
    password: new FormControl('', { nonNullable: true }),
    confirmar: new FormControl('', { nonNullable: true })
  });

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.aplicarRegras();
  }

  mudarModo(modo: Modo): void {
    this.modo.set(modo);
    this.erro.set(null);
    this.mensagem.set(null);
    this.form.controls.password.reset();
    this.form.controls.confirmar.reset();
    this.aplicarRegras();
  }

  campoInvalido(campo: keyof typeof this.form.controls): boolean {
    const controlo = this.form.controls[campo];
    return controlo.invalid && (controlo.touched || controlo.dirty);
  }

  get passwordsDiferentes(): boolean {
    return this.form.hasError('diferentes') && this.form.controls.confirmar.touched;
  }

  async submeter(): Promise<void> {
    if (this.carregando()) {
      return;
    }
    this.erro.set(null);
    this.mensagem.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => {
        this.formulario?.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    const email = this.form.controls.email.value.trim().toLowerCase();
    const password = this.form.controls.password.value;
    this.carregando.set(true);

    try {
      if (this.modo() === 'entrar') {
        const erro = await this.auth.entrar(email, password);
        if (erro) {
          this.erro.set(erro);
          return;
        }
        this.router.navigate(['/']);
      } else {
        const resultado = await this.auth.registar(email, password);
        if (resultado.erro) {
          this.erro.set(resultado.erro);
          return;
        }
        if (resultado.confirmarEmail) {
          this.mudarModo('entrar');
          this.mensagem.set('Enviámos um email de confirmação. Abre o link e depois entra com a tua conta.');
          return;
        }
        this.router.navigate(['/']);
      }
    } catch {
      this.erro.set('Sem ligação ao servidor. Verifica a internet e tenta novamente.');
    } finally {
      this.carregando.set(false);
    }
  }

  private aplicarRegras(): void {
    const { password, confirmar } = this.form.controls;

    if (this.modo() === 'registar') {
      password.setValidators([Validators.required, Validators.pattern(PASSWORD_FORTE), Validators.maxLength(72)]);
      confirmar.setValidators(Validators.required);
      this.form.setValidators(passwordsIguais);
    } else {
      password.setValidators(Validators.required);
      confirmar.clearValidators();
      this.form.clearValidators();
    }

    password.updateValueAndValidity();
    confirmar.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }
}