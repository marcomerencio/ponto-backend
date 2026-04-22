# Backend de Ponto com Admin

## Inclui
- Login JWT
- Perfis `funcionario` e `admin`
- Proteção de rotas por perfil
- Registo de entrada/saída
- Validação para evitar duas entradas ou duas saídas seguidas
- Filtro por datas
- Exportação CSV e PDF

## Instalação
```bash
cp .env.example .env
npm install
npm run dev
```

## Base de dados
Executar `database.sql` no MySQL.

## Credenciais demo
- Funcionário: `joao@empresa.com` / `123456`
- Admin: `admin@empresa.com` / `123456`

## Endpoints
### Público
- `POST /api/auth/login`

### Protegidos
- `POST /api/registros`
- `GET /api/registros/funcionario/:funcionarioId`

### Só admin
- `GET /api/funcionarios`
- `GET /api/funcionarios/:id`
- `GET /api/registros`
- `GET /api/registros/export/csv`
- `GET /api/registros/export/pdf`

## Filtros suportados
Nos endpoints de listagem/exportação:
- `dataInicio=YYYY-MM-DD`
- `dataFim=YYYY-MM-DD`
- `funcionarioId=FUNC001` (apenas em `/api/registros` e exports)

Exemplo:
`GET /api/registros?dataInicio=2026-04-01&dataFim=2026-04-30&funcionarioId=FUNC001`
