-- Ejecutar una vez en SQL Editor del proyecto Supabase.
-- Tabla independiente: no modifica tablas de encuestas existentes.
begin;
create table if not exists public.leadership_responses (
  id uuid primary key,
  nombre text check (char_length(nombre) <= 120),
  scores integer[] not null check (
    array_ndims(scores) = 1 and array_lower(scores, 1) = 1 and
    cardinality(scores) = 16 and array_position(scores, null) is null and
    scores <@ array[0,1,2,3]
  ),
  created_at timestamptz not null default now()
);
alter table public.leadership_responses enable row level security;
revoke all on public.leadership_responses from public, anon, authenticated;

create or replace function public.submit_leadership_response(
  p_id uuid, p_nombre text, p_scores integer[]
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_id is null or p_scores is null or
     array_ndims(p_scores) is distinct from 1 or
     array_lower(p_scores, 1) is distinct from 1 or
     cardinality(p_scores) <> 16 or
     array_position(p_scores, null) is not null or
     not (p_scores <@ array[0,1,2,3]) or
     char_length(p_nombre) > 120 then
    raise exception 'Respuesta invalida' using errcode = '22023';
  end if;
  insert into public.leadership_responses (id, nombre, scores)
  values (p_id, nullif(btrim(p_nombre), ''), p_scores)
  on conflict (id) do nothing;
end;
$$;

-- Solo devuelve totales. Los nombres y puntajes individuales no son públicos.
-- Empates: orden original de los estilos, igual que en el navegador.
create or replace function public.leadership_summary()
returns jsonb language sql stable security definer set search_path = '' as $$
  with top_styles as (
    select ranked.style_index
    from public.leadership_responses r
    cross join lateral (
      select n as style_index
      from generate_series(1,16) n
      order by r.scores[n] desc, n asc
      limit 3
    ) ranked
  ), counts as (
    select n, count(t.style_index) as total
    from generate_series(1,16) n
    left join top_styles t on t.style_index = n
    group by n
  )
  select jsonb_build_object(
    'total', (select count(*) from public.leadership_responses),
    'counts', (select jsonb_agg(total order by n) from counts)
  );
$$;
revoke all on function public.submit_leadership_response(uuid,text,integer[]) from public, anon, authenticated;
revoke all on function public.leadership_summary() from public, anon, authenticated;
grant execute on function public.submit_leadership_response(uuid,text,integer[]) to anon, authenticated;
grant execute on function public.leadership_summary() to anon, authenticated;
commit;
