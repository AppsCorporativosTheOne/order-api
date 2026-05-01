# Order API

API para operacao de restaurantes, lanchonetes, cafeterias e negocios similares.

## Base

- Base URL local: `http://localhost:3333`
- Content-Type: `application/json`

## Produto

### Modelo

```json
{
  "id": "0f936806-0930-4f0d-a27f-0e38cc3c22a7",
  "brand": "Coca-Cola",
  "name": "Coca-Cola Lata 350ml",
  "category": "Refrigerantes",
  "department": "Bebidas",
  "sellWithoutStock": "NO",
  "createdAt": "2026-05-01T13:00:00.000Z"
}
```

### Campos

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| id | uuid | sim | Identificador unico do produto. |
| brand | string ou null | nao | Marca do produto. |
| name | string | sim | Nome comercial do produto. Deve ser unico. |
| category | string | sim | Categoria do produto, por exemplo `Refrigerantes`. |
| department | string | sim | Departamento do produto, por exemplo `Bebidas`. |
| sellWithoutStock | enum | sim | `YES` permite vender sem estoque; `NO` bloqueia venda sem estoque. |
| createdAt | datetime | sim | Data de cadastro gerada pela API. |

### Criar Produto

`POST /products`

Request:

```json
{
  "brand": "Coca-Cola",
  "name": "Coca-Cola Lata 350ml",
  "category": "Refrigerantes",
  "department": "Bebidas",
  "sellWithoutStock": "NO"
}
```

Responses:

- `201 Created`: produto criado.
- `400 Bad Request`: dados invalidos.
- `409 Conflict`: produto ja cadastrado com o mesmo nome.

### Listar Produtos

`GET /products`

Query params opcionais:

| Parametro | Descricao |
| --- | --- |
| search | Busca por nome ou marca. |
| category | Filtra por categoria exata. |
| department | Filtra por departamento exato. |

Response `200 OK`:

```json
[
  {
    "id": "0f936806-0930-4f0d-a27f-0e38cc3c22a7",
    "brand": "Coca-Cola",
    "name": "Coca-Cola Lata 350ml",
    "category": "Refrigerantes",
    "department": "Bebidas",
    "sellWithoutStock": "NO",
    "createdAt": "2026-05-01T13:00:00.000Z"
  }
]
```

### Buscar Produto por ID

`GET /products/{id}`

Responses:

- `200 OK`: produto encontrado.
- `400 Bad Request`: id invalido.
- `404 Not Found`: produto nao encontrado.

## Estoque

O estoque e registrado por lancamentos/lotes. Essa decisao preserva quantidade, fabricacao,
validade e valores de cada entrada do produto.

### Modelo

```json
{
  "id": "aa15f98e-43e9-44d4-9ef3-cf9016c7f8bf",
  "productId": "0f936806-0930-4f0d-a27f-0e38cc3c22a7",
  "quantity": 10,
  "manufacturingDate": "2026-04-20T00:00:00.000Z",
  "expirationDate": "2026-07-20T00:00:00.000Z",
  "unitValue": 8.5,
  "cost": 4,
  "finalValue": 85,
  "createdAt": "2026-05-01T13:00:00.000Z"
}
```

### Campos

| Campo | Tipo | Obrigatorio | Descricao |
| --- | --- | --- | --- |
| id | uuid | sim | Identificador unico do lancamento de estoque. |
| productId | uuid | sim | Produto vinculado ao estoque. |
| quantity | number | sim | Quantidade adicionada ao estoque. Deve ser maior que zero. |
| manufacturingDate | date ou null | nao | Data de fabricacao no formato `YYYY-MM-DD`. |
| expirationDate | date ou null | nao | Data de validade no formato `YYYY-MM-DD`. Nao pode ser anterior a fabricacao. |
| unitValue | number | sim | Valor unitario usado para calcular o valor final. |
| cost | number | sim | Custo unitario do produto neste lancamento/lote. |
| finalValue | number | sim | Calculado pela API: `quantity * unitValue`. |
| createdAt | datetime | sim | Data de cadastro do lancamento. |

### Criar Lancamento de Estoque

`POST /stocks`

Request:

```json
{
  "productId": "0f936806-0930-4f0d-a27f-0e38cc3c22a7",
  "quantity": 10,
  "manufacturingDate": "2026-04-20",
  "expirationDate": "2026-07-20",
  "unitValue": 8.5,
  "cost": 4
}
```

Responses:

- `201 Created`: lancamento criado.
- `400 Bad Request`: dados invalidos.
- `404 Not Found`: produto nao encontrado.

### Listar Lancamentos de Estoque

`GET /stocks`

Query params opcionais:

| Parametro | Descricao |
| --- | --- |
| productId | Filtra por produto. |
| expiresUntil | Filtra lotes com validade ate a data informada. Formato `YYYY-MM-DD`. |

Response `200 OK`:

```json
[
  {
    "id": "aa15f98e-43e9-44d4-9ef3-cf9016c7f8bf",
    "productId": "0f936806-0930-4f0d-a27f-0e38cc3c22a7",
    "quantity": 10,
    "manufacturingDate": "2026-04-20T00:00:00.000Z",
    "expirationDate": "2026-07-20T00:00:00.000Z",
    "unitValue": 8.5,
    "cost": 4,
    "finalValue": 85,
    "createdAt": "2026-05-01T13:00:00.000Z"
  }
]
```

### Buscar Lancamento de Estoque por ID

`GET /stocks/{id}`

Responses:

- `200 OK`: lancamento encontrado.
- `400 Bad Request`: id invalido.
- `404 Not Found`: lancamento nao encontrado.

## Operadores

Operadores registram quem trabalha cada caixa. O cadastro e simples porque o relacionamento mesa/pedido
sera tratado futuramente; por ora o importante e ter um identificador estavel ligado aos drawers.

### Modelo

```json
{
  "id": "8d4d4d5c-96d3-4635-9246-61d5d5d5dfaf",
  "name": "Isabela Martins",
  "code": null,
  "active": true,
  "createdAt": "2026-05-01T13:00:00.000Z",
  "updatedAt": "2026-05-01T13:00:00.000Z"
}
```

### Criar operador

`POST /operators`

```json
{ "name": "Isabela Martins", "code": "ADM1" }
```

`code` e opcional. Quando enviado, deve ser unico entre os cadastros para evitar conflitos de codigos repetidos/PIN curto.

### Listar operadores

`GET /operators`

Query opcional: `activeOnly=true`.

### Buscar operador por ID

`GET /operators/{id}`

## Caixa registradora

O fluxo esta dividido em **caixa principal** (tesouraria do dia, atrelada a `cash_day_sessions`),
**sessao do operador** (cada funcionario com as mesmas regras de abertura/fechamento do caixa da loja)
e **pedidos/mesas** amarrados ao dia principal e ao drawer do operador que abriu o atendimento.

### Caixa principal e incorporacao automatica

- `principalOpeningBalance` e informado ao abrir o dia (padrao `0`) e representa o fundo de caixa da gestao/tesouraria.
- Cada fechamento de drawer gera automaticamente um lancamento `OPERATOR_CLOSE_CONTRIBUTION` em `cash_principal_movements`
  com o **valor conferido** (`countedCashBalance`) daquele operador, incorporando o numerario ao caixa principal.
- Lancamentos manuais do principal (suprimento/sangria/ajustes) usam `POST /cash/day-sessions/{id}/principal-movements`
  com os kinds `PRINCIPAL_SUPPLY`, `PRINCIPAL_WITHDRAWAL`, `OTHER_IN`, `OTHER_OUT`.
- O **overview** (`/overview`) retorna `principal.movementTotals`, `principal.movements` e
  `principal.liveExpectedPrincipalCashBalance` calculado como `principalOpeningBalance + netImpact` dos movimentos do principal.

Regras criticas para o frontend:

1. **`businessDate` sempre no formato `YYYY-MM-DD`** (data de negocio, interpretada pela API conforme Postgres `date`).
2. **So pode existir um registro de dia por data**: apos criar/fechar esse dia ele nunca pode ser reaberto pela API atual.
   Abrir segunda sessao para a mesma data retorna erro `409` (`CASH_DAY_ALREADY_OPEN`
   quando a primeira ainda esta aberta ou `CASH_DAY_DATE_ALREADY_USED` se o dia foi encerrado).
3. Cada combinacao `{cashDaySessionId, operatorId}` aparece apenas uma vez; nao existe reabrir o drawer do mesmo
   operador no mesmo dia porque o relacionamento esta protegido por restricao SQL.
4. Antes do operador iniciar novo dia diferente precisa estar com **nenhuma sessao anterior em aberto** em outra data
   (`409 OPERATOR_HAS_OPEN_DRAWER`).
5. **Nao e possivel fechar o drawer com pedidos/mesas `OPEN`** (`409 CASH_OPERATOR_HAS_OPEN_ORDERS`).
6. **Todos os drawers precisam estar `CLOSED` antes do encerramento do dia** e o fechamento exige informar
   `countedPrincipalCashBalance` para conferencia final da tesouraria (`PATCH /cash/day-sessions/{...}/close`).

### Ciclo esperado pela UI

1. `POST /cash/day-sessions` com `{ "businessDate": "YYYY-MM-DD", "principalOpeningBalance": 500 }` (campo opcional).
2. `POST /cash/day-sessions/{cashDaySessionId}/operator-sessions` para cada funcionario (`openingBalance` opcional).
3. Abrir pedidos/mesas via `POST /cash/operator-sessions/{operatorSessionId}/orders` e encerrar com
   `PATCH /cash/orders/{cashOrderId}/close` quando o atendimento terminar.
4. Durante expediente usar `POST /cash/operator-sessions/{operatorSessionId}/movements` para dinheiro no drawer.
5. Opcionalmente movimentar o caixa principal com `POST /cash/day-sessions/{cashDaySessionId}/principal-movements`.
6. `PATCH /cash/operator-sessions/{operatorSessionId}/close` com `countedCashBalance` — isso aciona a incorporacao ao principal.
7. `PATCH /cash/day-sessions/{cashDaySessionId}/close` com `countedPrincipalCashBalance` apos todos os operadores fechados.

### Ler metadados do dia pela data vs visao gerencial completa

- `GET /cash/day-sessions/dates/{businessDate}/session` retorna apenas a linha de `cash_day_sessions`.
- `GET /cash/day-sessions/dates/{businessDate}/overview` monta todas as sessoes dos operadores, totais monetarios por drawer
   e valores esperados atualizados.
- Equivalente usando UUID: `GET /cash/day-sessions/{cashDaySessionId}/overview`.
- `GET /cash/day-sessions/{cashDaySessionId}/orders` lista pedidos/mesas associados ao caixa principal daquele dia.

### Mesas (cadastro)

`POST /dining-tables` — `{ "name": "Mesa 12", "sortOrder": 10 }`

`GET /dining-tables` — query `activeOnly=true` opcional.

`GET /dining-tables/{id}`

### Pedidos / mesas em atendimento

Cada registro em `cash_orders` aponta obrigatoriamente para `cash_day_session_id` (caixa principal do dia)
e `cash_operator_session_id` (quem abriu o fluxo).

- Abrir: `POST /cash/operator-sessions/{operatorSessionId}/orders` — body `{ "diningTableId": null, "notes": "" }`.
- Encerrar: `PATCH /cash/orders/{cashOrderId}/close`.

### Movimentacao monetaria atual (drawers dos operadores)

Todos os valores sao sempre positivos; o campo `cashEffect` (calculado no backend) diz se o fluxo aumenta ou reduz efetivamente
dinheiro no drawer.

| Kind | Direcao | Uso atual |
| --- | --- | --- |
| PAYMENT_RECEIVED | IN | Entrada de valores de clientes ate integrar vendas automatizadas. |
| CHANGE_DELIVERED | OUT | Saida correspondente ao troco. |
| CASH_SUPPLY | IN | Suprimento de numerario. |
| CASH_WITHDRAWAL | OUT | Sangria/supressao autorizada do caixa. |
| OTHER_IN / OTHER_OUT | IN / OUT | Ajustes manuais quando nao existe classificacao dedicada. |

`referenceType` e `referenceId` existem para acoplar `pedidos`, `payments` ou `stock_events` quando o modulo seguinte ficar disponivel.

Entrada fisica/saida fisica continua sendo registrada em `/stocks` — nela nao há obrigatoriamente ligacao monetaria ate existir valorizacao pelo pedido. Quando o fluxo automatizado aparecer os servicos so precisarao emitir `PAYMENT_RECEIVED / CHANGE_DELIVERED` usando os refs para auditoria.

### Abrir sessao diaria

`POST /cash/day-sessions`

```json
{
  "businessDate": "2026-05-01",
  "notes": "Abertura com fiscal presente.",
  "principalOpeningBalance": 500
}
```

### Abrir sessao por operador

`POST /cash/day-sessions/{cashDaySessionId}/operator-sessions`

```json
{ "operatorId": "...", "openingBalance": 120.75, "notes": "Valor parcial conferido pela gerencia." }
```

`openingBalance` e opcional; omitir significa valor zero inicial.

### Detalhar um drawer especifico

`GET /cash/operator-sessions/{operatorSessionId}/detail`

Retorna `movementTotals`, `movements`, `computed.liveExpectedCashBalance` (abertura + somatorio enquanto a sessao esta aberta).

### Registrar movimento

`POST /cash/operator-sessions/{operatorSessionId}/movements`

```json
{
  "kind": "PAYMENT_RECEIVED",
  "amount": 65.40,
  "description": "Venda manual ate integracao com pedidos",
  "referenceType": "MANUAL_NOTE",
  "referenceId": null,
  "occurredAt": "2026-05-01T18:43:09.223Z"
}
```

### Fechar drawer do operador

`PATCH /cash/operator-sessions/{operatorSessionId}/close`

```json
{ "countedCashBalance": 780.42, "notes": "Conciliado com duas supervisoes." }
```

`expectedCashBalance` final obedece a `openingBalance + totals.netImpact` com arredondamento em duas casas decimais e
`cashDifference = countedCashBalance - expectedCashBalance`.

Apos o fechamento o backend grava automaticamente `OPERATOR_CLOSE_CONTRIBUTION` no caixa principal com o valor conferido.

### Encerramento do dia inteiro (tesouraria principal)

`PATCH /cash/day-sessions/{cashDaySessionId}/close`

```json
{ "countedPrincipalCashBalance": 15420.15, "principalCloseNotes": "Conferido com gerencia." }
```

O corpo e obrigatorio (JSON). A API calcula `principalExpectedCashBalance` com base em
`principalOpeningBalance` + somatorio dos movimentos do principal (incluindo as incorporacoes dos operadores)
e retorna `principalCashDifference` junto com o snapshot `principalTotalsSnapshot`.

Falha enquanto houver alguma sessao de operador com status `OPEN`.

## Erros

```json
{
  "code": "PRODUCT_ALREADY_EXISTS",
  "message": "Produto ja cadastrado com este nome."
}
```

Codigos extras do modulo de caixa (padrao `code` igual ao restante da API):

- `OPERATOR_ALREADY_EXISTS`, `OPERATOR_NOT_FOUND`, `OPERATOR_INACTIVE`
- `CASH_DAY_ALREADY_OPEN`, `CASH_DAY_DATE_ALREADY_USED`, `CASH_DAY_NOT_FOUND`, `CASH_DAY_ALREADY_CLOSED`,
  `CASH_DAY_HAS_OPEN_OPERATOR_SESSIONS`, `CASH_DAY_CLOSED`
- `CASH_OPERATOR_SESSION_ALREADY_EXISTS`, `CASH_OPERATOR_SESSION_NOT_FOUND`, `CASH_OPERATOR_SESSION_ALREADY_CLOSED`
- `CASH_OPERATOR_HAS_OPEN_ORDERS`, `CASH_OPERATOR_SESSION_CLOSED`
- `OPERATOR_HAS_OPEN_DRAWER`, `OPERATOR_ALREADY_CONSOLIDATED_IN_PRINCIPAL`
- `INVALID_OPENING_BALANCE`, `INVALID_MOVEMENT_AMOUNT`, `INVALID_PRINCIPAL_OPENING_BALANCE`
- `CASH_ORDER_NOT_FOUND`, `CASH_ORDER_ALREADY_CLOSED`, `CASH_ORDER_CLOSE_REJECTED`
- `DINING_TABLE_NOT_FOUND`, `DINING_TABLE_INACTIVE`, `DINING_TABLE_ALREADY_EXISTS`, `INVALID_TABLE_NAME`
- `CASH_DAY_CLOSE_REJECTED`

Respostas de validacao continuam usando `VALIDATION_ERROR` na raiz quando o problema vem do schema Zod.
