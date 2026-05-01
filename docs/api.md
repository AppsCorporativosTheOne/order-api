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

## Erros

```json
{
  "code": "PRODUCT_ALREADY_EXISTS",
  "message": "Produto ja cadastrado com este nome."
}
```
