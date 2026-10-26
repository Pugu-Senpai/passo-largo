-- =====================================================================
-- Passo Largo · 004 · Missões: validação sem função SECURITY DEFINER exposta
-- Correr depois do 003: SQL Editor > New query > colar > Run
--
-- Antes: a app chamava concluir_missao(), uma função "security definer"
-- (corre com permissões de administrador) acessível pela API.
-- Agora: a verificação fica numa função num esquema PRIVADO, que a API
-- não expõe, e é usada por uma política RLS. A função pública passa a
-- correr com as permissões de quem a chama ("security invoker").
-- =====================================================================


-- 1. Esquema privado (não aparece na API do Supabase: só "public" está exposto)
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;


-- 2. Verificação completa de uma missão cumprida.
--    É "security definer" para conseguir ler os registos e calcular o progresso,
--    mas fica no esquema privado: não pode ser chamada pela API.
create or replace function privado.missao_cumprida(p_aventureiro bigint, p_missao smallint, p_semana date)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return
    -- o aventureiro é da conta com sessão iniciada
    exists (
      select 1 from public.aventureiros
      where id = p_aventureiro and conta_id = auth.uid()
    )
    -- só se concluem missões da semana atual
    and p_semana = public.semana_atual()
    -- a missão é uma das 3 sorteadas para este aventureiro nesta semana
    and exists (
      select 1 from public.missoes_da_semana(p_aventureiro, p_semana) m
      where m.id = p_missao
    )
    -- o objetivo está cumprido, calculado a partir dos registos
    and public.progresso_missao(p_aventureiro, p_missao, p_semana)
        >= (select meta from public.missoes where id = p_missao);
end;
$$;

revoke all on function privado.missao_cumprida(bigint, smallint, date) from public, anon;
grant execute on function privado.missao_cumprida(bigint, smallint, date) to authenticated;


-- 3. A app pode inserir conclusões, mas só estas 3 colunas
--    (o id e a data de conclusão são sempre definidos pela base de dados)
grant insert (aventureiro_id, missao_id, semana_inicio) on public.missoes_concluidas to authenticated;

-- ... e só se a missão estiver mesmo cumprida (verificado no servidor)
drop policy if exists "Concluir missão cumprida" on public.missoes_concluidas;
create policy "Concluir missão cumprida"
  on public.missoes_concluidas for insert to authenticated
  with check (privado.missao_cumprida(aventureiro_id, missao_id, semana_inicio));

-- Alterar e apagar continua proibido (não há política nem permissão para isso)


-- 4. A função que a app chama passa a "security invoker":
--    corre com as permissões do utilizador, por isso tem de passar pela política acima.
create or replace function public.concluir_missao(p_aventureiro bigint, p_missao smallint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_semana date := public.semana_atual();
begin
  if not privado.missao_cumprida(p_aventureiro, p_missao, v_semana) then
    raise exception 'Missão ainda não cumprida' using errcode = '22023';
  end if;

  -- Se já estava concluída, não faz nada: os pontos não duplicam
  insert into public.missoes_concluidas (aventureiro_id, missao_id, semana_inicio)
  values (p_aventureiro, p_missao, v_semana)
  on conflict (aventureiro_id, missao_id, semana_inicio) do nothing;
end;
$$;

revoke execute on function public.concluir_missao(bigint, smallint) from public, anon;
grant  execute on function public.concluir_missao(bigint, smallint) to authenticated;

-- Verificação: deve mostrar "concluir_missao | false" (já não é security definer)
select proname, prosecdef as security_definer
from pg_proc
where proname in ('concluir_missao', 'missao_cumprida')
order by proname;
