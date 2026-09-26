-- Aplique após a 008 no SQL Editor do Supabase (como administrador).
-- Políticas permissivas adicionais são combinadas com OR pelo PostgreSQL;
-- remover só as políticas com nome "logados" não garante isolamento.

begin;

create or replace function public.dono_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where lower(email) = lower((select valor from public.config where chave = 'dono_email'))
  limit 1
$$;

-- Por padrão, funções PostgreSQL dão EXECUTE a PUBLIC. Somente o papel
-- authenticated precisa consultar dono_id() nas políticas abaixo.
revoke all on function public.dono_id() from public, anon;
grant execute on function public.dono_id() to authenticated;

do $$
declare
  t text;
  politica record;
begin
  foreach t in array array[
    'alunos', 'aulas', 'aulas_suspensas', 'agendamentos',
    'planos', 'compras', 'cobrancas', 'config'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    -- Políticas existentes (mesmo com nomes inesperados) não podem ampliar o acesso.
    for politica in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', politica.policyname, t);
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated
       using ((select auth.uid()) = (select public.dono_id()))
       with check ((select auth.uid()) = (select public.dono_id()))',
      t || ' - somente dono', t
    );
  end loop;
end $$;

commit;
