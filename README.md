
# ChatMap Cloud Backend

## Tech Stack
- Node.js 18
- Fastify
- Prisma
- PostgreSQL
- JWT auth

## Environment Variables

- `DATABASE_URL` e.g. `postgresql://chatmap:yourpass@chatmap-db:5432/chatmap`
- `JWT_SECRET` e.g. `change_me_secret`
- `PORT` (optional, default 3001)

## Running locally

```bash
cd backend
npm install
npx prisma generate
docker compose up -d
# OR run Postgres separately and:
npm run dev
```

## Prisma Migrations

In production, use:

```bash
npx prisma migrate deploy
```

## API Documentation

### Auth

#### POST /auth/register
Body:
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response 200:
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

#### POST /auth/login
Body:
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response 200:
```json
{
  "token": "JWT_TOKEN_HERE"
}
```

### Workflows (all require `Authorization: Bearer <token>` header)

#### GET /me/workflows
List all workflows for the current user.

Response 200:
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "My ChatGPT Session",
    "state": {
      "nodes": [ ... ]
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### POST /me/workflows
Create a new workflow.

Body:
```json
{
  "title": "My Session Name"
}
```

Response 200:
```json
{
  "id": 1,
  "userId": 1,
  "title": "My Session Name",
  "state": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### GET /me/workflows/:id
Fetch one workflow.

#### PUT /me/workflows/:id
Update a workflow title and/or state.

Body:
```json
{
  "title": "Optional New Title",
  "state": {
    "nodes": [
      { "id": "...", "title": "...", "messageText": "...", "domRefId": "...", "done": false }
    ]
  }
}
```

---

## Chrome Extension Integration

The extension:

- Logs in via `/auth/login` or registers via `/auth/register`.
- Calls `POST /me/workflows` once to create a workflow for the current chat session.
- Calls `PUT /me/workflows/:id` with `state: { nodes: [...] }` to save the latest tree.

The backend stores everything in `Workflow.state` JSON, which you can extend later for:
- Tags
- Project grouping
- Mind map layout metadata
