# Passo Largo

**Treino em casa, 30 minutos por dia, do Shire até Mount Doom.**

Passo Largo é uma aplicação web (SPA) em Angular para treinar em casa sem ginásio, com a temática da Terra Média. Cada sessão de força, cardio ou treino misto, e cada corrida ou caminhada, converte-se em quilómetros numa jornada de **2855 km** do Shire até Mount Doom, com marcos pelo caminho, missões semanais, sequência de dias (streak) e consequências quando se falha.

> Projeto_3 do módulo de Angular e TypeScript (UpSkill 2026).

---

## Aplicação publicada

🔗 **https://pugu-senpai.github.io/passo-largo/**

Publicada automaticamente no **GitHub Pages** através do **GitHub Actions** a cada push para a branch `main`.

---

## Funcionalidades

| Página | O que faz |
|---|---|
| **Entrar** | Criar conta e entrar com email e palavra-passe (Supabase Auth). Palavra-passe forte, confirmação, mostrar/ocultar, mensagens de erro genéricas. |
| **Quem vem lá?** | Uma conta pode ter vários aventureiros, escolhidos em cartões com avatar. Modo "Gerir perfis" para apagar. |
| **Novo aventureiro** | Formulário com avatar, nome, género, idade, peso, altura, estado físico, dias de descanso por semana e kettlebell. |
| **Condado** | Painel principal: mapa do percurso com marcos e viajante, km feitos, próximo marco, progresso, streak, "Começar a jornada de hoje", "Acampar" e as missões da semana. Conselhos do Mago Branco (1 em cada 3 visitas) e janelas ilustradas de aviso de falhas, avanço do inimigo, jornada falhada e conquista. |
| **Jornada de hoje** | **Força**, **Cardio** ou **Misto**: sessão de 30 minutos com temporizador, pausa e exercícios sorteados conforme o nível. No cardio também há **Corrida** e **Caminhada**, onde se registam os km e os minutos. Música de fundo e, de 5 em 5 a 10 em 10 sessões, um vídeo surpresa. |
| **Exercícios** | Biblioteca com pesquisa (ignora acentos) e filtros por tipo e zona do corpo. |
| **Detalhe do exercício** | Séries, repetições ou duração, músculos trabalhados, passos e vídeo de demonstração. |
| **Missões** | As 3 missões da semana (1 grande e 2 pequenas), com progresso, pontos totais e histórico por semana. |
| **Calendário** | Mês a mês, com o estado de cada dia: completo, acampamento ou falha. |
| **Perfil** | Resumo da atividade, pontos das missões, dados do corpo, IMC e edição dos dados. |
| **Definições** | Tema (automático, claro ou escuro) e apagar o perfil. |

### Regras da jornada

- **Dia completo:** 30 minutos ativos. Menos do que isso é falha, mas os km contam e pode repetir-se no mesmo dia (os minutos somam).
- **Distância:** nas sessões, minutos × taxa entre 0,10 e 0,20 km/min, conforme os exercícios feitos. Na corrida e na caminhada contam os km reais.
- **Acampar:** 1 ou 2 dias de descanso por semana (definido no perfil). Contam para o streak.
- **Falhas:** expiram ao fim de 30 dias. Com 5 falhas ativas, o inimigo avança e o aventureiro recua (20 km, depois 30, 40...), mas nunca para trás do último marco alcançado.
- **Derrota:** 30 dias seguidos sem treinar. A jornada falha e recomeça no Shire.
- **Missões semanais:** sorteadas por aventureiro, de segunda a domingo. Missão pequena: 10 pontos. Missão grande: 30 pontos.

---

## Tecnologias

- **Angular 22** (componentes standalone, sem Zone.js, signals)
- **TypeScript** e **RxJS**
- **Supabase**: PostgreSQL, API REST e autenticação
- **GitHub Actions** e **GitHub Pages**
- **CSS** próprio, mobile first, com tema claro e escuro

---

## Fonte de dados: Supabase

| Tabela | Conteúdo | Quem acede |
|---|---|---|
| `exercicios` | 24 exercícios (força e cardio) | Só leitura, com sessão |
| `marcos` | 12 marcos do percurso | Só leitura, com sessão |
| `missoes` | 14 missões (8 pequenas e 6 grandes) | Só leitura, com sessão |
| `aventureiros` | Perfis de cada conta | Só a conta dona |
| `jornadas` | Jornadas de cada aventureiro | Só a conta dona |
| `registos` | Um registo por aventureiro e por dia | Só a conta dona |
| `missoes_concluidas` | Missões concluídas por semana | Só a conta dona (inserir só se a missão estiver cumprida) |

A app comunica com o Supabase de duas formas:

1. **`HttpClient` do Angular → API REST do Supabase** (`/rest/v1/...`), no `DadosService`, para os exercícios e os marcos: pedidos tipados com interfaces, `Observable` + `subscribe()`, com estados de carregamento e de erro.
2. **Biblioteca `@supabase/supabase-js`**, para a autenticação, os dados de cada conta e as missões (funções `missoes_da_semana` e `concluir_missao`).

Scripts da base de dados (pasta [`supabase/`](supabase)), a correr **por esta ordem**:

| Script | Conteúdo |
|---|---|
| `001_esquema.sql` | Tabelas, restrições e políticas de segurança (RLS) |
| `002_dados_fixos.sql` | Os 24 exercícios e os 12 marcos |
| `003_missoes.sql` | Missões, sorteio semanal e cálculo do progresso |
| `004_missoes_seguranca.sql` | Validação das missões num esquema privado (sem funções `SECURITY DEFINER` expostas na API) |

---

## Instalação e execução local

### Requisitos

- **Node.js** 22.22 ou superior (ou 24.15 ou superior)
- Uma conta gratuita em [supabase.com](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/Pugu-Senpai/passo-largo.git
cd passo-largo
npm install
```

### 2. Preparar o Supabase

1. Criar um projeto novo no Supabase.
2. Em **SQL Editor**, correr os scripts da pasta `supabase/`, de `001` a `004`, por ordem.
3. Em **Authentication → Sign In / Providers → Email**, definir a palavra-passe com mínimo de 8 caracteres, com minúsculas, maiúsculas, números e símbolos.
4. Em **Authentication → URL Configuration**, pôr `http://localhost:4200` nos Redirect URLs.
5. Em **Settings → API Keys**, copiar o **Project URL** e a chave **publishable**.

### 3. Variáveis de ambiente

A chave do Supabase **não está no código**. Copiar o ficheiro de exemplo e preencher:

```bash
cp .env.example .env
```

```
SUPABASE_URL=https://o-teu-projeto.supabase.co
SUPABASE_KEY=sb_publishable_...
```

O `.env` está no `.gitignore` e nunca vai para o GitHub. O script `scripts/gerar-ambiente.mjs` lê estes valores e gera `src/environments/environment*.ts` automaticamente antes de cada `npm start` e `npm run build`. Se a chave for uma chave **secreta** (`sb_secret_...` ou `service_role`), o script **recusa-se** a continuar.

### 4. Executar

```bash
npm start
```

Abrir `http://localhost:4200`.

### Build de produção

```bash
npm run build
```

Os ficheiros ficam em `dist/passo-largo/browser`.

---

## Publicação (GitHub Actions + GitHub Pages)

O workflow [`.github/workflows/publicar.yml`](.github/workflows/publicar.yml) corre a cada push para a `main`:

1. instala as dependências com as versões exatas do `package-lock.json` (`npm ci`);
2. gera os ficheiros de ambiente a partir dos **Secrets** do repositório;
3. faz o build de produção com `--base-href /passo-largo/`;
4. publica no GitHub Pages.

Para usar num fork:
- **Settings → Secrets and variables → Actions:** criar `SUPABASE_URL` e `SUPABASE_KEY`;
- **Settings → Pages → Source:** `GitHub Actions`;
- no Supabase, acrescentar o endereço do Pages em **Authentication → URL Configuration**.

O workflow tem permissões mínimas (ler o código e publicar no Pages).

---

## Segurança

O princípio é **nunca confiar no frontend**:

- **Row Level Security em todas as tabelas.** Cada conta só lê e altera os seus aventureiros, jornadas, registos e missões. Os catálogos são só de leitura.
- **Sem sessão, não há acesso:** o papel anónimo não tem permissões em nenhuma tabela.
- **Restrições na base de dados:** `CHECK` em todos os valores, chaves estrangeiras, um registo por dia e uma só jornada ativa por aventureiro.
- **Missões validadas no servidor:** o sorteio e o cálculo do progresso são feitos pela base de dados. Uma missão só pode ser concluída se estiver mesmo cumprida, e os pontos vêm do catálogo, nunca da app.
- **Variáveis de ambiente:** a chave fica no `.env` (local) e nos Secrets do GitHub (produção), nunca no código. O script de geração bloqueia chaves secretas.
- **O dono de cada registo é definido pela base de dados** (`auth.uid()`), e a app envia sempre listas fechadas de campos.
- **Palavra-passe forte**, com a mesma regra no formulário e no servidor.
- **Mensagens de erro genéricas**, que não revelam se um email tem conta.
- **Rotas protegidas por guard.**
- **Vídeo do YouTube** em `youtube-nocookie.com`, com `sandbox` no `iframe` e endereço fixo no código.
- **Sem `innerHTML`**: todo o texto passa pelo escape automático do Angular.
- **Dependências verificadas** com `npm audit` (0 vulnerabilidades).

### Limitações conhecidas

- **A chave publishable está no JavaScript publicado.** É assim por natureza (o browser precisa dela para falar com o Supabase) e o Supabase considera-a segura para expor. A proteção dos dados está no RLS.
- **Confirmação de email desligada.** O serviço de email do plano gratuito do Supabase só envia para os membros da equipa do projeto. Para a ligar é preciso um serviço SMTP próprio.
- **Proteção contra palavras-passe vazadas** indisponível no plano gratuito.
- **Os km são calculados no browser.** O RLS impede o acesso aos dados de outras contas, mas um utilizador com conhecimentos técnicos consegue alterar o seu próprio progresso. Numa versão com rankings, este cálculo passaria para o servidor.
- **`overrides` do Vite no `package.json`.** Força o Vite 8.3.5 para corrigir vulnerabilidades do servidor de desenvolvimento enquanto não sai uma versão estável do Angular que o inclua.

---

## Requisitos do enunciado

| Requisito | Onde está |
|---|---|
| **1. Componentes** | `CabecalhoApp`, `CartaoExercicio`, `CartaoPerfil`, `CartaoMissao`, `CartaoAviso`, `FormularioPerfil`, `MapaPercurso`, `ConselhoMago`, `MusicaJornada`, `DialogoConfirmacao` |
| **2. Data binding** | `{{ }}` (km, temporizador), `[ ]` (`[disabled]`, `[style.width.%]`), `( )` (`(click)`, `(ngSubmit)`), `[( )]` (filtros, escolhas da Jornada, tema) |
| **2. `@if`, `@for`, `@switch`** | Estados de carregamento e erro; listas de exercícios, perfis e missões; fases da Jornada e estado do dia |
| **2. Pipes** | `number`, `percent` e `date`, em `pt-PT` |
| **2. Filtrar sem DOM** | Pesquisa e filtros da página Exercícios |
| **3. `@Input` / `@Output`** | `CartaoExercicio`, `CartaoMissao` (`item` → `receber`), `CartaoAviso` (`imagem`, `titulo` → `continuar`), `FormularioPerfil`, `CartaoPerfil`, `ConselhoMago`. Também projeção de conteúdo com `<ng-content>` em `CartaoAviso` e `MusicaJornada` |
| **4. Services e interfaces** | 11 services com `@Injectable` em `services/`, interfaces em `models/` |
| **5. `HttpClient`** | `DadosService` → API REST do Supabase, com `Observable` e `subscribe()`, carregamento e erro |
| **5. Supabase** | Autenticação e base de dados (7 tabelas com RLS) |
| **5. GitHub Actions + Pages** | `.github/workflows/publicar.yml` |
| **5. Variáveis de ambiente** | `.env` + `scripts/gerar-ambiente.mjs` + Secrets do GitHub |
| **6. Router** | 11 rotas, `router-outlet`, `RouterLink`, rota com parâmetro (`exercicios/:id`) e guards |
| **7. Reactive Forms** | `Entrar`, `FormularioPerfil` e o registo de corrida e caminhada: `FormGroup`, `FormControl`, `Validators`, mensagens de erro, submissão bloqueada |
| **8. `OnInit` / `OnDestroy`** | `OnInit` nas páginas; `OnDestroy` na Jornada (temporizador) e no `MusicaJornada` (som) |

---

## Estrutura

```
.github/workflows/  publicação automática no GitHub Pages
scripts/            geração dos ficheiros de ambiente
src/app/
├── components/     peças reutilizáveis (cartões, avisos, formulário, mapa, cabeçalho, mago, música)
├── pages/          uma pasta por página
├── services/       dados, autenticação, missões e regras do jogo
├── guards/         proteção das rotas
├── models/         interfaces, tipos, regras e frases
└── utils/          datas e cálculo do percurso
supabase/           scripts SQL da base de dados
public/             ilustrações, ícones e música
```

---

## Acessibilidade

Pontuação **100** no Lighthouse. Contraste AA nos dois temas, estados que nunca dependem só da cor, foco visível, link "Saltar para o conteúdo", anúncio da mudança de página, formulários com `aria-invalid` e `aria-describedby`, janelas com `<dialog>` nativo (foco preso e tecla Escape) e respeito por `prefers-reduced-motion`.

---

## Créditos

- Ilustrações e ícones: criados para este projeto, com apoio de ferramentas de IA (Google Flow) e edição própria.
- Vídeo surpresa: incorporado do YouTube através do leitor `youtube-nocookie.com`; os direitos pertencem ao respetivo autor.
- Temática inspirada em _O Senhor dos Anéis_, de J.R.R. Tolkien. Projeto académico, sem fins comerciais.
