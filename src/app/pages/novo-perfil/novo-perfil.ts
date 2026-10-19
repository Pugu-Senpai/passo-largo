import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UtilizadorService, NovoUtilizador } from '../../services/utilizador.service';
import { NivelFisico } from '../../models/tipos';

@Component({
  selector: 'app-novo-perfil',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './novo-perfil.html',
  styleUrl: './novo-perfil.css'
})
export class NovoPerfil {
  niveis: { valor: NivelFisico; rotulo: string }[] = [
    { valor: 'sedentario', rotulo: 'Sedentário' },
    { valor: 'pouco-ativo', rotulo: 'Pouco ativo' },
    { valor: 'ativo', rotulo: 'Ativo' },
    { valor: 'muito-ativo', rotulo: 'Muito ativo' }
  ];

  form = new FormGroup({
    nome: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(20)]
    }),
    idade: new FormControl<number | null>(null, [Validators.required, Validators.min(16), Validators.max(100)]),
    peso: new FormControl<number | null>(null, [Validators.required, Validators.min(30), Validators.max(300)]),
    altura: new FormControl<number | null>(null, [Validators.required, Validators.min(100), Validators.max(250)]),
    temKettlebell: new FormControl(false, { nonNullable: true }),
    nivelFisico: new FormControl<NivelFisico | null>(null, Validators.required),
    diasDescansoSemana: new FormControl<1 | 2>(1, { nonNullable: true })
  });

  constructor(
    private utilizadorService: UtilizadorService,
    private router: Router
  ) {}

  campoInvalido(campo: keyof typeof this.form.controls): boolean {
    const controlo = this.form.controls[campo];
    return controlo.invalid && (controlo.touched || controlo.dirty);
  }

  submeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const dados: NovoUtilizador = {
      nome: valores.nome.trim(),
      idade: valores.idade!,
      peso: valores.peso!,
      altura: valores.altura!,
      temKettlebell: valores.temKettlebell,
      nivelFisico: valores.nivelFisico!,
      diasDescansoSemana: valores.diasDescansoSemana
    };

    const novo = this.utilizadorService.criar(dados);
    this.utilizadorService.definirAtivo(novo.id);
    this.router.navigate(['/condado']);
  }
}