-- =====================================================================
-- Passo Largo · 001 · Esquema da base de dados
-- Correr uma vez no Supabase: SQL Editor > New query > colar > Run
-- =====================================================================


-- =====================================================================
-- 1. DADOS FIXOS (iguais para todos; só leitura a partir da app)
-- =====================================================================

create table public.exercicios (
  id               smallint primary key,
  nome             text not null check (char_length(nome) between 2 and 60),
  tipo             text not null check (tipo in ('forca', 'cardio')),
  zona             text not null check (zona in ('full-body', 'upper', 'lower')),
  niveis           text[] not null check (
                     cardinality(niveis) > 0
                     and niveis <@ array['sedentario', 'pouco-ativo', 'ativo', 'muito-ativo']::text[]
                   ),
  intensidade      text check (intensidade in ('leve', 'moderado', 'vigoroso')),
  equipamento      text not null check (equipamento in ('nenhum', 'kettlebell')),
  musculos         text[] not null default '{}',
  passos           text[] not null default '{}',
  series           smallint not null check (series between 1 and 10),
  repeticoes       smallint check (repeticoes between 1 and 200),
  duracao_segundos smallint check (duracao_segundos between 5 and 600),
  video            text check (video ~ '^https://'),
  -- cada exercício tem repetições ou duração
  check (repeticoes is not null or duracao_segundos is not null)
);

create table public.marcos (
  id        smallint primary key,
  nome      text not null check (char_length(nome) between 2 and 40),
  km        numeric(6, 1) not null unique check (km between 0 and 2855),
  descricao text not null,
  -- só letras minúsculas e hífen: o valor é usado num caminho de imagem
  icone     text not null check (icone ~ '^[a-z-]+$'),
  posicao   numeric(5, 4) not null check (posicao between 0 and 1)
);


-- =====================================================================
-- 2. DADOS DE CADA CONTA
-- =====================================================================

create table public.aventureiros (
  id                   bigint generated always as identity primary key,
  -- dono: preenchido pela base de dados com o utilizador da sessão
  conta_id             uuid not null default auth.uid()
                         references auth.users (id) on delete cascade,
  nome                 text not null check (char_length(btrim(nome)) between 2 and 20),
  genero               text not null default 'nao-dizer'
                         check (genero in ('masculino', 'feminino', 'nao-dizer')),
  -- só letras minúsculas, números e hífen: o valor é usado num caminho de imagem
  avatar               text not null default 'padrao' check (avatar ~ '^[a-z0-9-]+$'),
  idade                smallint not null check (idade between 16 and 100),
  peso                 numeric(4, 1) not null check (peso between 30 and 300),
  altura               smallint not null check (altura between 100 and 250),
  tem_kettlebell       boolean not null default false,
  nivel_fisico         text not null
                         check (nivel_fisico in ('sedentario', 'pouco-ativo', 'ativo', 'muito-ativo')),
  dias_descanso_semana smallint not null default 1 check (dias_descanso_semana in (1, 2)),
  data_criacao         date not null default current_date
);

create index aventureiros_conta_idx on public.aventureiros (conta_id);


create table public.jornadas (
  id                bigint generated always as identity primary key,
  aventureiro_id    bigint not null references public.aventureiros (id) on delete cascade,
  estado            text not null default 'ativa' check (estado in ('ativa', 'concluida', 'falhada')),
  km_percorridos    numeric(5, 1) not null default 0 check (km_percorridos between 0 and 2855),
  ultimo_marco_id   smallint references public.marcos (id),
  numero_recuos     smallint not null default 0 check (numero_recuos >= 0),
  data_ultimo_recuo date,
  data_inicio       date not null default current_date,
  data_fim          date,
  check (data_fim is null or data_fim >= data_inicio),
  -- permite aos registos confirmar que a jornada é do mesmo aventureiro
  unique (id, aventureiro_id)
);

create index jornadas_aventureiro_idx on public.jornadas (aventureiro_id);

-- no máximo uma jornada ativa por aventureiro
create unique index jornadas_uma_ativa_idx
  on public.jornadas (aventureiro_id)
  where estado = 'ativa';


create table public.registos (
  id                bigint generated always as identity primary key,
  aventureiro_id    bigint not null,
  jornada_id        bigint not null,
  data              date not null check (data <= current_date + 1),
  estado            text not null check (estado in ('completo', 'descanso', 'falha')),
  tipo_treino       text check (tipo_treino in ('forca', 'cardio', 'misto')),
  minutos_ativos    smallint not null default 0 check (minutos_ativos between 0 and 300),
  exercicios_feitos smallint not null default 0 check (exercicios_feitos between 0 and 500),
  km_ganhos         numeric(5, 1) not null default 0 check (km_ganhos between 0 and 150),
  km_reais          numeric(5, 1) check (km_reais between 0 and 100),
  -- a jornada tem de pertencer ao mesmo aventureiro
  foreign key (jornada_id, aventureiro_id)
    references public.jornadas (id, aventureiro_id) on delete cascade,
  -- um registo por aventureiro e por dia
  unique (aventureiro_id, data)
);

create index registos_jornada_idx on public.registos (jornada_id);


-- =====================================================================
-- 3. SEGURANÇA: Row Level Security
-- Com RLS ligado, nada é permitido a não ser o que as políticas dizem.
-- =====================================================================

alter table public.exercicios   enable row level security;
alter table public.marcos       enable row level security;
alter table public.aventureiros enable row level security;
alter table public.jornadas     enable row level security;
alter table public.registos     enable row level security;

-- Visitantes sem sessão não têm qualquer acesso a estas tabelas
revoke all on public.exercicios, public.marcos, public.aventureiros,
              public.jornadas, public.registos
  from anon;

-- Dados fixos: quem tem sessão pode ler; ninguém escreve pela app
create policy "Ler exercícios com sessão"
  on public.exercicios for select to authenticated
  using (true);

create policy "Ler marcos com sessão"
  on public.marcos for select to authenticated
  using (true);

-- Aventureiros: só os da própria conta (ler, criar, alterar, apagar)
create policy "Aventureiros da própria conta"
  on public.aventureiros for all to authenticated
  using (conta_id = (select auth.uid()))
  with check (conta_id = (select auth.uid()));

-- Jornadas: só as de aventureiros da própria conta
create policy "Jornadas da própria conta"
  on public.jornadas for all to authenticated
  using (exists (
    select 1 from public.aventureiros a
    where a.id = aventureiro_id and a.conta_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.aventureiros a
    where a.id = aventureiro_id and a.conta_id = (select auth.uid())
  ));

-- Registos: só os de aventureiros da própria conta
create policy "Registos da própria conta"
  on public.registos for all to authenticated
  using (exists (
    select 1 from public.aventureiros a
    where a.id = aventureiro_id and a.conta_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.aventureiros a
    where a.id = aventureiro_id and a.conta_id = (select auth.uid())
  ));
