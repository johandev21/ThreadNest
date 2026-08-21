# ThreadNest

Clon ligero de Reddit. Las comunidades se llaman **nests**, las publicaciones viven dentro de los nests y los hilos de comentarios se anidan dentro de cada publicación.

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Funcionalidades](#funcionalidades)
5. [Requisitos previos](#requisitos-previos)
6. [Instalación](#instalación)
7. [Scripts disponibles](#scripts-disponibles)
8. [API](#api)
9. [Tiempo real](#tiempo-real)

## Descripción general

ThreadNest es un monorepo con dos aplicaciones:

| Aplicación | Ruta | Descripción |
| ---------- | ---- | ----------- |
| Servidor | `apps/server` | API REST con Elysia.js, autenticación, base de datos SQLite y WebSockets. Escucha en el puerto `3001`. |
| Cliente web | `apps/web` | Frontend con Next.js (App Router) en el puerto `3000`. |

## Stack tecnológico

| Capa | Tecnología |
| ---- | ---------- |
| Runtime | Bun |
| Backend | Elysia.js |
| Autenticación | Better Auth (correo y contraseña) |
| Base de datos | SQLite mediante el driver nativo `bun:sqlite` |
| ORM | Drizzle ORM con drizzle-kit para migraciones |
| Type safety | Eden Treaty (`@elysiajs/eden`) para un cliente de API tipado de extremo a extremo |
| Frontend | Next.js 16 (App Router), React 19 |
| UI | shadcn/ui, Tailwind CSS 4, lucide-react |
| Estado de datos | TanStack Query v5 |
| Tiempo real | WebSockets nativos de Elysia |

## Estructura del repositorio

```
threadnest/
├── package.json
├── PLAN.md
├── apps/
│   ├── server/
│   │   └── src/
│   │       ├── index.ts            # Ensamblado de la app y .listen()
│   │       ├── auth.ts             # Instancia de betterAuth
│   │       ├── plugins/better-auth.ts  # Montaje del handler y macro de sesión
│   │       ├── db/
│   │       │   ├── schema.ts       # Tablas de autenticación y dominio
│   │       │   ├── client.ts       # Instancia de bun:sqlite + Drizzle
│   │       │   └── seed.ts         # Datos iniciales
│   │       ├── modules/            # nests, posts, comments, votes
│   │       └── realtime/hub.ts     # Registro de temas y difusión
│   └── web/
│       ├── app/                    # Rutas: login, register, submit, n/[slug], p/[id]
│       ├── components/
│       ├── hooks/
│       └── lib/
```

## Funcionalidades

- Nests (comunidades) con slug, descripción, contador de miembros y de publicaciones.
- Publicaciones de tipo texto o enlace dentro de cada nest.
- Comentarios anidados con respuestas ilimitadas.
- Sistema de votos (positivo, negativo o neutro) sobre publicaciones y comentarios.
- Feed con ordenamiento por populares (`hot`), recientes (`new`) o mejor votados (`top`) y paginación por cursor.
- Unirse o abandonar nests.
- Autenticación completa con registro e inicio de sesión.
- Actualizaciones en tiempo real vía WebSockets.

## Requisitos previos

- [Bun](https://bun.sh) 1.4 o superior.

## Instalación

```bash
bun install
bun run db:push
bun run db:seed
```

## Scripts disponibles

Ejecutados desde la raíz del monorepo:

| Comando | Descripción |
| ------- | ----------- |
| `bun run dev:server` | Inicia la API en modo desarrollo con recarga automática (puerto 3001). |
| `bun run dev:web` | Inicia el frontend de Next.js (puerto 3000). |
| `bun run db:push` | Sincroniza el esquema de Drizzle con la base de datos SQLite. |
| `bun run db:seed` | Pobla la base de datos con datos de ejemplo. |
| `bun run typecheck` | Ejecuta la verificación de tipos en todos los workspaces. |

Scripts adicionales en `apps/server`: `db:generate`, `db:migrate`, `start`.

## API

El servidor expone los siguientes grupos de rutas bajo `/api`:

| Grupo | Ruta base | Descripción |
| ----- | --------- | ----------- |
| Salud | `/api/health` | Comprobación de estado del servicio. |
| Auth | `/api/auth` | Endpoints de Better Auth (registro, inicio de sesión, sesión). |
| Nests | `/api/nests` | Creación, listado y detalle de comunidades. |
| Posts | `/api/posts` | Publicaciones dentro de nests y feed con cursor. |
| Comments | `/api/comments` | Comentarios anidados por publicación. |
| Votes | `/api/votes` | Votos sobre publicaciones y comentarios. |

Las rutas protegidas usan una macro de autenticación que resuelve la sesión desde Better Auth y devuelve `401` si no hay usuario autenticado.

## Tiempo real

El módulo `realtime/hub.ts` implementa un registro de temas con helpers de difusión mediante los WebSockets nativos de Elysia (`.ws()`), lo que permite sincronizar votos, comentarios y actividad sin recargar la página.
