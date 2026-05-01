# Order API

API em Node.js para restaurantes, lanchonetes, cafeterias e negocios similares.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Zod

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env
```

3. Execute as migrations:

```bash
npm run db:migrate
```

4. Suba a API:

```bash
npm run dev
```

## Documentacao

- Contrato da API: `docs/api.md`
- OpenAPI: `docs/openapi.yaml`
