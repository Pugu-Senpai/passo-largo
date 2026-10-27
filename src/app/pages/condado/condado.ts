import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { JornadaService } from '../../services/jornada.service';
import { DadosService } from '../../services/dados.service';
import { UtilizadorService } from '../../services/utilizador.service';
import { RegistoService } from '../../services/registo.service';
import { ProgressoService } from '../../services/progresso.service';
import { Utilizador } from '../../models/utilizador.model';
import { Jornada } from '../../models/jornada.model';
import { Marco } from '../../models/marco.model';
import { firstValueFrom } from 'rxjs';
import { RegistoDia } from '../../models/registo-dia.model';
import { hoje, diferencaDias } from '../../utils/datas';
import { CabecalhoApp } from '../../components/cabecalho-app/cabecalho-app';
import { MapaPercurso } from '../../components/mapa-percurso/mapa-percurso';
import { CartaoMissao } from '../../components/cartao-missao/cartao-missao';
import { ConselhoMago } from '../../components/conselho-mago/conselho-mago';
import { CartaoAviso } from '../../components/cartao-aviso/cartao-aviso';
import { ArmazenamentoService } from '../../services/armazenamento.service';
import { FRASES_MAGO } from '../../models/frases-mago';
import { REGRAS } from '../../models/regras';
import { MissaoService } from '../../services/missao.service';
import { Missao, MissaoDaSemana } from '../../models/missao.model';

@Component({
  selector: 'app-condado',
  imports: [RouterLink, DecimalPipe, PercentPipe, DatePipe, CabecalhoApp, MapaPercurso, CartaoMissao, ConselhoMago, CartaoAviso],
  templateUrl: './condado.html',
  styleUrl: './condado.css'
})
export class Condado implements OnInit {
  utilizador?: Utilizador;
  jornada?: Jornada;
  marcos: Marco[] = [];
  marcoAtual?: Marco;
  proximoMarco?: Marco;
  registoHoje?: RegistoDia;
  streak = 0;
  carregando = true;
  erro = false;
  derrota = false;
  houveRecuo = false;
  kmRecuados = 0;
  mensagemDescanso = '';
  concluida = false;
  treinosJornada = 0;
  descansosRestantes = 0;
  aCriar = false;
  erroNovaJornada = '';
  aAcampar = false;
  erroDescanso = '';
  carregandoMissoes = true;
  erroMissoes = '';
  missaoAReceber: number | null = null;

  private readonly CHAVE_VISITAS = 'pl_visitas_condado';
  private readonly CHAVE_ULTIMA_FRASE = 'pl_ultima_frase_mago';
  readonly mostrarMago = signal(false);

  readonly mostrarAvisoFalhas = signal(false);
  readonly mostrarAvanco = signal(false);
  readonly mostrarDerrota = signal(false);
  readonly mostrarConquista = signal(false);
  kmJornadaFalhada = 0;
  marcoJornadaFalhada = '';
  falhasAtivas = 0;
  private ultimaFalhaAvisada = '';
  fraseMago = '';

  constructor(
    private utilizadorService: UtilizadorService,
    private jornadaService: JornadaService,
    private dadosService: DadosService,
    private registoService: RegistoService,
    private progressoService: ProgressoService,
    private missaoService: MissaoService,
    private armazenamento: ArmazenamentoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.utilizador = this.utilizadorService.obterAtivo();
    if (!this.utilizador) {
      this.router.navigate(['/']);
      return;
    }
    this.decidirMago();
    this.carregar();
  }

  // ===== Mago Branco =====

  private decidirMago(): void {
    // O localStorage pode ser alterado à mão: só aceitamos inteiros válidos
    const lidas = this.armazenamento.ler<number>(this.CHAVE_VISITAS, 0);
    const visitas = Number.isInteger(lidas) && lidas >= 0 ? lidas : 0;
    this.armazenamento.guardar(this.CHAVE_VISITAS, visitas + 1);

    if (visitas % 3 !== 0) {
      return;
    }

    const ultima = this.armazenamento.ler<number>(this.CHAVE_ULTIMA_FRASE, -1);
    let indice = Math.floor(Math.random() * FRASES_MAGO.length);
    if (indice === ultima) {
      indice = (indice + 1) % FRASES_MAGO.length;
    }
    this.armazenamento.guardar(this.CHAVE_ULTIMA_FRASE, indice);

    this.fraseMago = FRASES_MAGO[indice];
    this.mostrarMago.set(true);
  }

  fecharMago(): void {
    this.mostrarMago.set(false);
  }

  // ===== Aviso de falhas =====

  private chaveAvisoFalhas(): string {
    return `pl_aviso_falha_${this.utilizador!.id}`;
  }

  private verificarAvisoFalhas(): void {
    if (this.derrota || this.houveRecuo) {
      return;
    }
    const ultima = this.registoService.ultimaFalhaAtiva(this.jornada!);
    if (!ultima) {
      return;
    }

    const lida = this.armazenamento.ler<string>(this.chaveAvisoFalhas(), '');
    const avisada = typeof lida === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lida) ? lida : '';
    if (avisada >= ultima) {
      return;
    }

    this.falhasAtivas = this.registoService.falhasAtivas(this.jornada!);
    this.ultimaFalhaAvisada = ultima;
    this.mostrarAvisoFalhas.set(true);
  }

  fecharAvisoFalhas(): void {
    this.armazenamento.guardar(this.chaveAvisoFalhas(), this.ultimaFalhaAvisada);
    this.mostrarAvisoFalhas.set(false);
  }

  // ===== Conquista =====

  private chaveConquista(): string {
    return `pl_conquista_vista_${this.utilizador!.id}`;
  }

  private verificarConquista(jornadaId: number): void {
    const lida = this.armazenamento.ler<number>(this.chaveConquista(), 0);
    const vista = Number.isInteger(lida) ? lida : 0;
    if (vista !== jornadaId) {
      this.mostrarConquista.set(true);
    }
  }

  fecharConquista(): void {
    this.armazenamento.guardar(this.chaveConquista(), this.jornada!.id);
    this.mostrarConquista.set(false);
  }

  // ===== Jornada falhada =====

  fecharDerrota(): void {
    this.mostrarDerrota.set(false);
  }

  // ===== Avanço do inimigo =====

  fecharAvanco(): void {
    this.mostrarAvanco.set(false);
  }

  get proximoRecuoKm(): number {
    return REGRAS.recuoInicialKm + REGRAS.recuoIncrementoKm * (this.jornada?.numeroRecuos ?? 0);
  }

  get falhasAteRecuo(): number {
    return Math.max(REGRAS.falhasParaRecuo - this.falhasAtivas, 0);
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.erro = false;
    this.cdr.markForCheck();

    try {
      const ultima = this.jornadaService.obterUltima(this.utilizador!.id);
      if (ultima?.estado === 'concluida') {
        this.jornada = ultima;
        this.concluida = true;
        this.treinosJornada = this.registoService.treinosDaJornada(ultima.id);
        this.verificarConquista(ultima.id);
      } else {
        this.jornada = await this.jornadaService.obterOuCriar(this.utilizador!.id);
      }

      const marcos = await firstValueFrom(this.dadosService.obterMarcos());
      if (marcos.length === 0) {
        throw new Error('Sem marcos');
      }
      this.marcos = marcos;

      if (!this.concluida) {
        const kmAntes = this.jornada.kmPercorridos;
        const resultado = await this.progressoService.aplicarRegrasDiarias(this.utilizador!, this.jornada, marcos);
        this.jornada = resultado.jornada;
        this.derrota = resultado.derrota;
        this.houveRecuo = resultado.houveRecuo;
        this.kmRecuados = resultado.kmRecuados;
        if (this.derrota) {
          this.kmJornadaFalhada = kmAntes;
          const marco = this.jornadaService.marcoAtual(kmAntes, marcos);
          this.marcoJornadaFalhada = marco && marco.km > 0 ? marco.nome : '';
          this.mostrarDerrota.set(true);
        }
        this.mostrarAvanco.set(this.houveRecuo && !this.derrota);
        this.verificarAvisoFalhas();
      }

      this.atualizarResumo();
      this.carregarMissoes();
    } catch (e) {
      console.error('Erro ao preparar o Condado:', (e as Error).message);
      this.erro = true;
    } finally {
      this.carregando = false;
      this.cdr.markForCheck();
    }
  }

  // ===== Missões da semana =====

  get missoesSemana(): MissaoDaSemana[] {
    return this.utilizador ? this.missaoService.missoesDaSemana(this.utilizador.id) : [];
  }

  async carregarMissoes(): Promise<void> {
    this.carregandoMissoes = true;
    this.erroMissoes = '';
    this.cdr.markForCheck();

    try {
      await this.missaoService.garantirCarregado(this.utilizador!.id);
    } catch (e) {
      this.erroMissoes = (e as Error).message;
    } finally {
      this.carregandoMissoes = false;
      this.cdr.markForCheck();
    }
  }

  async receberPontos(missao: Missao): Promise<void> {
    if (this.missaoAReceber !== null) {
      return;
    }
    this.missaoAReceber = missao.id;
    this.erroMissoes = '';

    try {
      await this.missaoService.receberPontos(this.utilizador!.id, missao.id);
    } catch (e) {
      this.erroMissoes = (e as Error).message;
    } finally {
      this.missaoAReceber = null;
      this.cdr.markForCheck();
    }
  }

  async acampar(): Promise<void> {
    if (this.aAcampar) {
      return;
    }
    this.aAcampar = true;
    this.mensagemDescanso = '';
    this.erroDescanso = '';

    try {
      const aceite = await this.registoService.registarDescanso(this.utilizador!, this.jornada!.id);
      this.mensagemDescanso = aceite
        ? 'Montaste acampamento. Recupera forças para amanhã.'
        : 'Já usaste os dias de descanso desta semana.';
      this.atualizarResumo();
    } catch (e) {
      this.erroDescanso = (e as Error).message;
    } finally {
      this.aAcampar = false;
      this.cdr.markForCheck();
    }
  }

  private atualizarResumo(): void {
    const km = this.jornada!.kmPercorridos;
    this.marcoAtual = this.jornadaService.marcoAtual(km, this.marcos);
    this.proximoMarco = this.jornadaService.proximoMarco(km, this.marcos);
    this.streak = this.registoService.streak(this.jornada!.id);
    this.registoHoje = this.registoService.obterDia(this.utilizador!.id, hoje());
    this.descansosRestantes = this.registoService.descansosRestantes(this.utilizador!);
  }

  get progresso(): number {
    return this.jornada ? this.jornadaService.progresso(this.jornada.kmPercorridos) : 0;
  }

  get kmEmFalta(): number {
    if (!this.jornada || !this.proximoMarco) {
      return 0;
    }
    return this.proximoMarco.km - this.jornada.kmPercorridos;
  }

  get diasDeJornada(): number {
    if (!this.jornada) {
      return 0;
    }
    return diferencaDias(this.jornada.dataInicio, this.jornada.dataFim ?? hoje()) + 1;
  }

  get podeAcampar(): boolean {
    const estado = this.registoHoje?.estado;
    return !estado || estado === 'falha';
  }

  async novaJornada(): Promise<void> {
    if (this.aCriar) {
      return;
    }
    this.aCriar = true;
    this.erroNovaJornada = '';

    try {
      this.jornada = await this.jornadaService.obterOuCriar(this.utilizador!.id);
      this.concluida = false;
      this.atualizarResumo();
    } catch (e) {
      this.erroNovaJornada = (e as Error).message;
    } finally {
      this.aCriar = false;
      this.cdr.markForCheck();
    }
  }
}