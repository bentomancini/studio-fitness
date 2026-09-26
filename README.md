# Studio Brenno Mancini

Aplicativo de agenda e gerenciamento do Studio Brenno Mancini, feito para ser
usado no iPhone (Safari mobile) pelo administrador do estúdio.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (banco e
login) + PWA.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000 no navegador.

## Configuração do Supabase (uma vez)

1. Crie um projeto gratuito em https://supabase.com (New project).
2. Em **Project Settings > API**, copie o **Project URL** e a chave **anon public**.
3. Crie o arquivo `.env.local` a partir do `.env.example` e preencha os dois valores:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   ```

4. Em **Authentication > Users**, crie o usuário do administrador (e-mail + senha)
   e defina o UUID dele em `DONO_USER_ID` no `.env.local` e na hospedagem.
5. No SQL Editor, aplique as migrações em `supabase/migrations/` na ordem numérica.
   Antes de rodar `002_dono.sql`, ajuste o e-mail do proprietário nessa migração.
   **Aplique também `009_politicas_apenas_dono.sql`** em bancos existentes: ela remove
   políticas antigas permissivas. Migrações locais não são executadas automaticamente
   no Supabase nem pela aplicação.

## Estrutura

- `app/` — as telas (rotas do Next.js)
- `components/` — componentes de interface reutilizáveis
- `lib/supabase/` — conexões com o banco (navegador e servidor)
- `supabase/migrations/` — o SQL das tabelas e da segurança

## Verificações

```bash
npm run lint
npm run build
```

## Segurança

- O acesso às tabelas depende da aplicação da migração `009` no Supabase; as
  políticas devem permitir **somente o proprietário**, e não qualquer usuário logado.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` é uma chave **pública**, visível em ferramentas
  do navegador por definição; não concede acesso a dados sem autorização/RLS.
  Nunca configure uma chave `service_role`/`sb_secret_` ou a chave da Anthropic
  como `NEXT_PUBLIC_`, nem as coloque em `public/` ou no código-fonte.
- `ANTHROPIC_API_KEY` e `DONO_USER_ID` ficam somente no servidor; `.env.local`
  é ignorado pelo Git. O histórico do Copiloto não é mais salvo no navegador.
- Para conferir as políticas no SQL Editor, execute:

  ```sql
  select tablename, policyname, roles, qual, with_check
  from pg_policies
  where schemaname = 'public'
    and tablename in ('alunos', 'aulas', 'aulas_suspensas', 'agendamentos',
                      'planos', 'compras', 'cobrancas', 'config')
  order by tablename, policyname;
  ```

  Deve haver apenas uma política `somente dono` por tabela, para `authenticated`.
  Depois de aplicar a migração, execute `node scripts/check-seguranca-db.mjs`
  para testar chamadas anônimas sem imprimir nenhum dado ou chave.
