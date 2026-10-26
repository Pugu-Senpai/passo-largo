-- =====================================================================
-- Passo Largo · 003 · Missões semanais
-- Correr depois do 001 e do 002: SQL Editor > New query > colar > Run
--
-- Ideia: cada aventureiro recebe 3 missões por semana (1 grande e
-- 2 pequenas), sorteadas pela base de dados. Ao concluir uma missão
-- ganha pontos. É a base de dados que confirma se a missão foi mesmo
-- cumprida: a app não consegue atribuir pontos a si própria.
-- =====================================================================


-- =====================================================================
-- 1. TABELAS
-- =====================================================================

-- Catálogo de missões (dados fixos, iguais para todos)
create table public.missoes (
  id         smallint primary key,
  titulo     text not null check (char_length(titulo) between 2 and 60),
  descricao  text not null check (char_length(descricao) between 2 and 200),
  personagem text not null check (char_length(personagem) between 2 and 40),
  tamanho    text not null check (tamanho in ('pequena', 'grande')),
  criterio   text not null check (criterio in (
               'dias-forca', 'dias-cardio', 'dias-misto', 'dias-completos', 'km', 'exercicios'
             )),
  meta       numeric(6, 1) not null check (meta > 0),
  pontos     smallint not null check (pontos between 1 and 1000)
);

-- Missões concluídas por cada aventureiro (uma vez por semana, no máximo)
create table public.missoes_concluidas (
  id              bigint generated always as identity primary key,
  aventureiro_id  bigint not null references public.aventureiros (id) on delete cascade,
  missao_id       smallint not null references public.missoes (id),
  semana_inicio   date not null check (extract(isodow from semana_inicio) = 1), -- sempre uma segunda-feira
  data_conclusao  timestamptz not null default now(),
  unique (aventureiro_id, missao_id, semana_inicio)
);

create index missoes_concluidas_aventureiro_idx on public.missoes_concluidas (aventureiro_id);


-- =====================================================================
-- 2. SEGURANÇA: RLS e permissões
-- =====================================================================

alter table public.missoes            enable row level security;
alter table public.missoes_concluidas enable row level security;

-- Visitantes sem sessão: nada
revoke all on public.missoes, public.missoes_concluidas from anon;

-- A app só lê. Criar, alterar e apagar conclusões é feito apenas pela
-- função concluir_missao(), que confirma tudo antes de gravar.
revoke insert, update, delete on public.missoes, public.missoes_concluidas from authenticated;

create policy "Ler missões com sessão"
  on public.missoes for select to authenticated
  using (true);

create policy "Ler missões concluídas da própria conta"
  on public.missoes_concluidas for select to authenticated
  using (exists (
    select 1 from public.aventureiros a
    where a.id = aventureiro_id and a.conta_id = (select auth.uid())
  ));


-- =====================================================================
-- 3. FUNÇÕES
-- =====================================================================

-- Segunda-feira da semana atual, na hora de Portugal
-- (o servidor do Supabase trabalha em UTC)
create function public.semana_atual()
returns date
language sql stable
set search_path = ''
as $$
  select date_trunc('week', now() at time zone 'Europe/Lisbon')::date;
$$;


-- As 3 missões da semana de um aventureiro: 1 grande + 2 pequenas.
-- O sorteio é sempre igual para o mesmo aventureiro e a mesma semana
-- (usa um "hash"), por isso não é preciso guardá-lo.
create function public.missoes_da_semana(p_aventureiro bigint, p_semana date default null)
returns setof public.missoes
language sql stable
set search_path = ''
as $$
  with semana as (select coalesce(p_semana, public.semana_atual()) as inicio)
  (select m.* from public.missoes m, semana s
    where m.tamanho = 'grande'
    order by md5(p_aventureiro || '-' || s.inicio || '-' || m.id)
    limit 1)
  union all
  (select m.* from public.missoes m, semana s
    where m.tamanho = 'pequena'
    order by md5(p_aventureiro || '-' || s.inicio || '-' || m.id)
    limit 2);
$$;


-- Progresso de uma missão, calculado a partir dos registos da semana
create function public.progresso_missao(p_aventureiro bigint, p_missao smallint, p_semana date)
returns numeric
language sql stable
set search_path = ''
as $$
  select coalesce(
    case m.criterio
      when 'dias-forca'     then count(*) filter (where r.tipo_treino = 'forca'  and r.minutos_ativos > 0)
      when 'dias-cardio'    then count(*) filter (where r.tipo_treino = 'cardio' and r.minutos_ativos > 0)
      when 'dias-misto'     then count(*) filter (where r.tipo_treino = 'misto'  and r.minutos_ativos > 0)
      when 'dias-completos' then count(*) filter (where r.estado = 'completo')
      when 'km'             then sum(r.km_ganhos)
      when 'exercicios'     then sum(r.exercicios_feitos)
    end, 0)
  from public.missoes m
  left join public.registos r
    on r.aventureiro_id = p_aventureiro
   and r.data between p_semana and p_semana + 6
  where m.id = p_missao
  group by m.criterio;
$$;


-- Concluir uma missão: só grava se TUDO se confirmar no servidor.
-- "security definer" permite gravar numa tabela onde a app não pode
-- escrever diretamente; por isso as verificações abaixo são obrigatórias.
create function public.concluir_missao(p_aventureiro bigint, p_missao smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_semana date := public.semana_atual();
  v_meta   numeric;
begin
  -- 1. O aventureiro tem de ser da conta com sessão iniciada
  if not exists (
    select 1 from public.aventureiros
    where id = p_aventureiro and conta_id = auth.uid()
  ) then
    raise exception 'Aventureiro inválido' using errcode = '42501';
  end if;

  -- 2. A missão tem de ser uma das 3 desta semana
  if not exists (
    select 1 from public.missoes_da_semana(p_aventureiro, v_semana) m
    where m.id = p_missao
  ) then
    raise exception 'Esta missão não é desta semana' using errcode = '22023';
  end if;

  -- 3. O objetivo tem de estar cumprido
  select meta into v_meta from public.missoes where id = p_missao;
  if public.progresso_missao(p_aventureiro, p_missao, v_semana) < v_meta then
    raise exception 'Missão ainda não cumprida' using errcode = '22023';
  end if;

  -- 4. Grava (se já estava concluída, não faz nada: os pontos não duplicam)
  insert into public.missoes_concluidas (aventureiro_id, missao_id, semana_inicio)
  values (p_aventureiro, p_missao, v_semana)
  on conflict (aventureiro_id, missao_id, semana_inicio) do nothing;
end;
$$;

-- Só quem tem sessão pode chamar as funções
revoke execute on function public.semana_atual()                              from public, anon;
revoke execute on function public.missoes_da_semana(bigint, date)             from public, anon;
revoke execute on function public.progresso_missao(bigint, smallint, date)    from public, anon;
revoke execute on function public.concluir_missao(bigint, smallint)           from public, anon;
grant  execute on function public.semana_atual()                              to authenticated;
grant  execute on function public.missoes_da_semana(bigint, date)             to authenticated;
grant  execute on function public.concluir_missao(bigint, smallint)           to authenticated;
-- progresso_missao fica só para uso interno: a app calcula o progresso com os registos que já tem


-- =====================================================================
-- 4. CATÁLOGO DE MISSÕES
-- Pequenas: 10 pontos · Grandes: 30 pontos
-- =====================================================================

insert into public.missoes (id, titulo, descricao, personagem, tamanho, criterio, meta, pontos) values
  ( 1, 'A força dos anões',          'Gimli desafia-te a fazer 2 dias de treino de força esta semana.',            'Gimli',          'pequena', 'dias-forca',     2,  10),
  ( 2, 'Passo élfico',               'Legolas quer ver-te em 2 dias de cardio esta semana.',                       'Legolas',        'pequena', 'dias-cardio',    2,  10),
  ( 3, 'Um pouco de tudo',           'Merry e Pippin pedem um dia de treino misto.',                               'Merry e Pippin', 'pequena', 'dias-misto',     1,  10),
  ( 4, 'O caminho do Condado',       'Sam conta cada passo: percorre 10 km esta semana.',                          'Sam',            'pequena', 'km',            10,  10),
  ( 5, 'Um passo de cada vez',       'Frodo pede 2 dias completos (30 minutos) esta semana.',                      'Frodo',          'pequena', 'dias-completos', 2,  10),
  ( 6, 'Treino de Gondor',           'Boromir quer ver 30 exercícios feitos esta semana.',                         'Boromir',        'pequena', 'exercicios',    30,  10),
  ( 7, 'Lá e de volta outra vez',    'Bilbo lembra que todas as viagens começam perto de casa: faz 8 km.',         'Bilbo',          'pequena', 'km',             8,  10),
  ( 8, 'Vigia de Ithilien',          'Faramir pede 20 exercícios feitos esta semana.',                             'Faramir',        'pequena', 'exercicios',    20,  10),
  ( 9, 'O regresso do rei',          'Aragorn conta contigo: 5 dias completos esta semana.',                       'Aragorn',        'grande',  'dias-completos', 5,  30),
  (10, 'Um mago nunca se atrasa',    'Gandalf espera-te mais à frente: percorre 25 km esta semana.',               'Gandalf',        'grande',  'km',            25,  30),
  (11, 'O espelho de Galadriel',     'Galadriel viu o teu futuro: 80 exercícios feitos esta semana.',              'Galadriel',      'grande',  'exercicios',    80,  30),
  (12, 'A escudeira de Rohan',       'Éowyn treina sem descanso: 4 dias de força esta semana.',                    'Éowyn',          'grande',  'dias-forca',     4,  30),
  (13, 'O Conselho de Rivendell',    'Elrond pede resistência: 4 dias de cardio esta semana.',                     'Elrond',         'grande',  'dias-cardio',    4,  30),
  (14, 'Cavalga para Rohan',         'Théoden reúne os cavaleiros: 3 dias de treino misto esta semana.',           'Théoden',        'grande',  'dias-misto',     3,  30)
on conflict (id) do update set
  titulo = excluded.titulo, descricao = excluded.descricao, personagem = excluded.personagem,
  tamanho = excluded.tamanho, criterio = excluded.criterio, meta = excluded.meta, pontos = excluded.pontos;

-- Verificação: deve mostrar 8 pequenas e 6 grandes
select tamanho, count(*) from public.missoes group by tamanho order by tamanho;
