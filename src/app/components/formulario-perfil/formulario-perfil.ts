import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NovoUtilizador } from '../../services/utilizador.service';
import { Utilizador } from '../../models/utilizador.model';
import { NivelFisico } from '../../models/tipos';

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
      return;
    }

    const valores = this.form.getRawValue();
    this.submetido.emit({
      nome: valores.nome.trim(),
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
}