<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack (verified)

- Next.js `16.2.9` App Router, React `19.2.4`, TypeScript `5`, Node types `20`.
- Tailwind CSS `v4` via `@tailwindcss/postcss` (no `tailwind.config.*` — config lives in `src/app/globals.css` with `@theme inline`).
- shadcn registry style `base-nova` (see `components.json`); UI primitives in `src/components/ui/`, AI-specific building blocks in `src/components/ai-elements/`.
- AI SDK v6: `ai`, `@ai-sdk/react` (v3), `@ai-sdk/deepseek`, `@ai-sdk/mcp`, plus `streamdown` (with `@streamdown/{cjk,code,math,mermaid}` plugins wired in `message.tsx` / `reasoning.tsx`).
- `@rive-app/react-webgl2`, `@xyflow/react`, `motion`, `media-chrome`, `lottie` are in deps but not yet wired into pages.
- React Compiler is **on** (`next.config.ts` sets `reactCompiler: true`). Do not manually memoize components.
- `react-jsx-parser` is a runtime JSX evaluator — treat any user-supplied JSX in `ai-elements/jsx-preview.tsx` as untrusted.
- `web-preview.tsx` uses an iframe with `sandbox="allow-scripts allow-same-origin ..."` — `allow-same-origin` weakens the sandbox; do not point it at untrusted URLs.

## Scripts (only these exist)

`package.json` defines **only** `dev`, `build`, `start`. There is **no** `lint`, `test`, `typecheck`, or `format` script, and no test framework in `devDependencies`. To typecheck, run `npx tsc --noEmit` (or just `next build`).

## Lockfile / package manager ambiguity

Both `pnpm-lock.yaml` and `package-lock.json` are committed. Pick one and stick to it — running `pnpm install` after `npm install` (or vice versa) will churn the other lockfile. No `packageManager` field pins it; ask the user which to use before regenerating dependencies.

## Environment variables

Create a `.env.local` (gitignored). The only env var that is *actually read at runtime* is `DEEPSEEK_API_KEY` (read by `src/app/api/chat/key.ts`; the `/api/chat` route hard-fails without it). `.env` already exists in the repo root with that key set.

Two more vars are referenced but unused in the current app code:

- `CONTEXT7_API_KEY` — passed to the context7 MCP stdio subprocess in `src/app/api/chat/route.ts` via `!` non-null assertion, so a missing key throws at module load. Required if the route is exercised.
- `DATABASE_URL` — referenced only by `prisma.config.ts`. Schema is currently empty (see Prisma note below), so the var is not needed unless you start using Prisma.

## Storage is filesystem, not Prisma

Despite Prisma being installed, **no app code reads the Prisma client**. Chats are persisted as a single JSON file:

- `src/lib/chat-store.ts` writes/reads `<cwd>/data/chats.local.json` (gitignored; file already exists).
- `src/graph/tools/file/file_tools.ts` sandboxes the agent's file tools to `<cwd>/data/file-system-db.local/` — this path is **not** in `.gitignore`; files written by the agent will be committed.
- The file tools enforce path containment via `path.resolve` + `startsWith` check; never weaken `validatePath` in `file_tools.ts`.

## Prisma is half-set up

`prisma/schema.prisma` has only the `sqlite` datasource (no `url`) and no models. The generator is the new `prisma-client` (v7) emitting to `../src/generated/prisma` (gitignored). To actually use Prisma: add models, set `datasource.url = env("DATABASE_URL")`, and run `npx prisma migrate dev`. There is **no** `dev.db` in the repo — do not assume one exists.

Heads-up: `prisma.config.ts` does `import "dotenv/config"`. `dotenv` is not a direct `package.json` dependency — it is only present transitively (via `@dotenvx/dotenvx` / `prisma`'s installer). If you ever blow away `node_modules` and re-resolve with a minimal install, add `dotenv` to `devDependencies` or the config will fail to load.

## API route gotchas (`src/app/api/chat/route.ts`)

- `mcpClient` and the context7 toolset are constructed at **module top level** via top-level `await`. The module is effectively a singleton; tools load once at server start.
- `mcpClient.close()` only runs in the `onFinish` callback of `toUIMessageStreamResponse`. Errors that bypass `onFinish` leak the stdio subprocess.
- `export const maxDuration = 30` — long-running tool chains may be cut off.
- The seven file-system tools are **defined** in `src/lib/chat-tools.ts` as `fileToolDefs` (typed via `tool()` from `ai` + `zod`), and **spread** into the `tools` object in `route.ts` (`{ ...fileToolDefs, ...context7Tools }`). Do not re-define or duplicate them elsewhere; extend `fileToolDefs` and let the spread pick them up.
- `export type ToolMessage = UIMessage<never, never, InferUITools<typeof fileToolDefs>>` lives in `src/lib/chat-tools.ts` and is **imported by client components** (`src/app/chat/[id]/page.tsx`, `src/components/ChatView.tsx`, `src/components/ToolMessage.tsx`). Keep this type stable; renaming it or changing its `InferUITools` source is a cross-boundary break.
- The system prompt is a hardcoded Chinese string (`"你的名字叫派蒙，是提瓦特大陆的导游"`) — likely a placeholder. Centralize it before shipping.

## Unfinished auth stub

`src/components/ChatView.tsx` sends a hardcoded `'Authorization': 'Bearer xxx'` header on every chat request. The route handler does not read or validate this header, so it has zero effect today. Treat it as a stub — if you wire up real auth, remove the dummy header on the client and add a check on the server.

## Entry points

- `src/app/page.tsx` — server component that generates an id, creates a chat row, and `redirect`s to `/chat/<id>`. Hitting `/` always creates a new chat.
- `src/app/chat/[id]/page.tsx` — server component that loads the chat and renders `<ChatView>` (client).
- `src/app/api/chat/route.ts` — single POST handler. Client posts `{ id, messages }` via `DefaultChatTransport` (`src/components/ChatView.tsx`).
- `src/app/layout.tsx` — async; calls `loadChats()` on every render to feed the sidebar. List queries are O(chats) per request, and `loadChats()` re-reads + re-parses the whole JSON file each time.

## No CI

There is no `.github/workflows` directory. `README.md` is the default `create-next-app` boilerplate — do not trust it for project-specific info.
