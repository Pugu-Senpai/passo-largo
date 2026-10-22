import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface ResultadoRegisto {
  erro: string | null;
  confirmarEmail: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly sessao = signal<Session | null>(null);
  private readonly pronto: Promise<void>;

  constructor(private supabase: SupabaseService) {
    const auth = this.supabase.cliente.auth;

    this.pronto = auth.getSession().then(({ data }) => {
      this.sessao.set(data.session);
    });

    auth.onAuthStateChange((_evento, sessao) => {
      this.sessao.set(sessao);
    });
  }

  async estaAutenticado(): Promise<boolean> {
    await this.pronto;
    return this.sessao() !== null;
  }

  async entrar(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.cliente.auth.signInWithPassword({ email, password });
    return error ? this.traduzirErro(error.message) : null;
  }

  async registar(email: string, password: string): Promise<ResultadoRegisto> {
    const { data, error } = await this.supabase.cliente.auth.signUp({ email, password });
    if (error) {
      return { erro: this.traduzirErro(error.message), confirmarEmail: false };
    }
    return { erro: null, confirmarEmail: !data.session };
  }

  async sair(): Promise<void> {
    await this.supabase.cliente.auth.signOut();
    localStorage.removeItem('pl_utilizador_ativo');
  }

  private traduzirErro(mensagem: string): string {
    const texto = mensagem.toLowerCase();
    if (texto.includes('invalid login credentials')) return 'Email ou palavra-passe incorretos.';
    if (texto.includes('email not confirmed')) return 'Confirma o teu email antes de entrar.';
    if (texto.includes('already registered')) return 'Não foi possível criar a conta. Se já tens conta, experimenta entrar.';
    if (texto.includes('password')) return 'A palavra-passe não cumpre os requisitos de segurança.';
    if (texto.includes('rate limit')) return 'Demasiadas tentativas. Espera um pouco e tenta de novo.';
    return 'Não foi possível concluir o pedido. Tenta novamente.';
  }
}