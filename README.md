# conf-api — De REST a GraphQL: Construye APIs modernas con NestJS

**FLISol Panamá 2026** · Scaffold del taller · 2.5 horas

## Inicio rápido

```bash
docker compose up -d
cp .env.example .env       # revisar y completar JWT_SECRET
npm install
npm run start:dev
# http://localhost:3000/graphql
```

## Estructura de bloques

| Bloque | Tema | Archivos a completar |
|---|---|---|
| 1 | Entidad Conference | `conference/conference.entity.ts` |
| 2 | Entidades Talk & Workshop, @ResolveField | `talk/talk.entity.ts`, `workshop/workshop.entity.ts`, resolvers |
| 3 | N+1 & DataLoader | `talk/speaker-loader.service.ts`, `workshop-enrollment/enrollment-count-loader.service.ts` |
| 4 | Mutaciones con union errors | `registration/registration.service.ts`, `workshop-enrollment/workshop-enrollment.service.ts`, resolvers |

## Variables de entorno

```bash
JWT_SECRET=<secreto-seguro>   # Requerido — cambiar en producción
JWT_EXPIRES_IN=15m            # Expiración del token
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
NODE_ENV=development          # En producción: production (oculta stack traces)
```

## Autenticación

Todas las mutaciones protegidas requieren el header:
```
Authorization: Bearer <token>
```

Obtener el token:
```graphql
mutation {
  login(input: { email: "user@example.com", password: "secret" }) {
    token
    user { id name role }
  }
}
```

## Ver la solución

```bash
git checkout solution
```
