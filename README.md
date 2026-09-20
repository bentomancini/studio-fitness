# Intense Fitness

Aplicativo de agenda e gerenciamento do Intense Fitness, feito para ser
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

4. Abra **SQL Editor > New query**, cole o conteúdo de `supabase/migrations/000_inicial.sql`
   e clique em **Run**. Isso cria as tabelas e ativa a segurança (RLS).
5. Em **Authentication > Users**, clique em **Add user** e crie o usuário do
   administrador (e-mail + senha).

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

- Todas as tabelas têm Row Level Security ativada; só quem está logado acessa os dados.
- A chave secreta do Supabase (service role) nunca é usada no navegador.
- Variáveis sensíveis ficam só em `.env.local` (fora do Git).