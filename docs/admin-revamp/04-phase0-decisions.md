# Phase 0 — Decision Recommendations & Trade-offs

> Companion to `03-phase-plan.md`. Each Phase-0 decision below gets: context from this codebase,
> the options, trade-offs, and a recommendation. Recommendations are marked ✅. Once chosen,
> record the final call in the "Decision" line of each section.

Grounding facts (verified in repo):
- Current admin: CRA (`react-scripts` 4) + React 17 + Redux/thunk + React Router v5 +
  react-bootstrap + `material-table` 1.x + Material-UI v4. Builds only with
  `NODE_OPTIONS=--openssl-legacy-provider`. `material-table` and MUI v4 are abandoned/EOL.
- Deployment: admin is a **static SPA** served by nginx from `/var/www/admin` at
  `admin.allschooluniform.com`, with `/api` proxied to the Node backend. The customer storefront is
  a **separate Next.js app** (`school-uniforms-frontend`) sharing the same API.
- Auth middleware already accepts **both** `Authorization: Bearer` and httpOnly cookie.
- Backend: Express + Mongoose, ESM (`"type": "module"`), plain JS, `node --test` already used
  (returns module), **Redis already in the stack** (payment webhook state, Shiprocket token cache).
- Node v24 available.

---

## D0. Repo & coexistence strategy (constraint: **fresh repo, same MongoDB**)

The revamp ships from a **new repository** — new backend + new admin UI — pointed at the **existing
database** (same collections/schemas). The legacy repo keeps running throughout. This frames every
other decision:

**✅ Recommended shape — monorepo in the new repo:**

```
asu-v2/        (scaffolded at ~/Desktop/asu-v2 — "asu-next" was taken by an older Next.js experiment)
  apps/
    api/        new backend (modular, per 02-backend-redesign.md §2)
    admin/      new admin SPA
  packages/
    schemas/    zod schemas + Mongoose models = the single source of truth for the shared DB
    shared/     enums (status charts, permission catalog), utilities shared api↔admin
```

- ✚ One PR spans schema + api + admin; zod schemas give the admin end-to-end types for free.
- ✖ Requires basic workspace tooling (npm workspaces is enough — no turbo needed at this size).

**Shared-database rules (the part that will bite if skipped):**
1. **Single-writer per domain** — at any moment, exactly ONE service (legacy or new) owns writes to
   a domain's collections. Cutover = flip ownership + route together (nginx: `/api/v2` and the new
   admin → new service). Reads from both are fine.
2. **Write-compatible during transition** — until the legacy admin/storefront stop reading a
   domain, the new service must keep legacy fields alive (e.g. order FSM writes canonical
   `status`/`statusHistory` **and** the `tracking{}` booleans + `orderStatus` string). Dropped only
   when the last legacy reader dies (greppable exit-gate item per phase).
3. **No schema forks** — `packages/schemas` mirrors the live collections exactly at the start;
   evolutions are additive-first (new fields nullable/defaulted), destructive changes only after
   both services agree.
4. **Storefront untouched** — the Next.js storefront keeps consuming the legacy API until a
   deliberate (out-of-scope) migration; customer-facing endpoints are the last to move ownership.
   Watch the overlap points: customer return creation and Razorpay/Shiprocket webhooks must each
   live in whichever service owns that domain at the time.
5. **Webhooks & jobs move with ownership** — when shipping cuts over, the Shiprocket webhook URL
   repoints to the new service in the same deploy; reconciliation jobs run only in the owner.

**Decision:** ✅ Accepted as recommended (2026-07-10).

---

## D1. Frontend stack for the new admin

### Options

**A) Incremental upgrade of the existing CRA app** — migrate in place (React 18, Router v6, replace
material-table…).
- ✚ No parallel app; no auth/deploy changes.
- ✖ react-scripts is dead (CRA officially sunset); every core dependency (MUI v4, material-table,
  Router v5, Redux-thunk patterns) needs replacement anyway → effectively a rewrite done in the
  hardest possible way, inside 43 screens that constrain the new design. Contradicts the "no
  reference to existing UI" goal.

**B) ✅ New Vite + React + TypeScript SPA in `admin/` (same repo)**
- Stack: Vite, React 18/19, TypeScript, **TanStack Query** (server state — replaces the entire
  Redux action/constant/reducer triplication), **React Router v7 (library mode)**, **Tailwind +
  shadcn/ui** (owned components, not a dependency), **TanStack Table** (headless — powers the
  Phase-1 table kit), **react-hook-form + zod** (zod schemas shared with backend validation),
  recharts (team already knows it), cmdk for the ⌘K palette. PDF generation moves **out of the
  frontend entirely** — see D6.
- ✚ Ships as static files → drops into the existing `/var/www/admin` nginx block with zero infra
  change. Old and new admin can even coexist during migration (`/v2/` sub-path or a second server
  block) — exactly what the strangler plan needs.
- ✚ Query invalidation replaces ~90 hand-written Redux reset/success flags; forms + tables built
  once as a kit.
- ✖ A second app to maintain until the old one retires; TypeScript learning curve if unfamiliar.

**C) Next.js admin app**
- ✚ One framework across storefront + admin; server components for heavy report pages.
- ✖ Requires a Node server (or static export that forfeits most Next benefits) — today's admin
  hosting is plain static files; SSR/SEO benefits are worthless behind a login; heavier mental
  model for an internal tool. Choose this only if consolidating both frontends into one Next.js
  codebase is a near-term goal.

**D) Admin framework (Refine / React-Admin)**
- ✚ CRUD screens (users, schools, classes, templates) nearly free; auth/data-provider plumbing done.
- ✖ The hard 60% of this admin is NOT CRUD — returns workspace, QC flow, shipping panel, NDR
  worklists, picking drawers, billing document editor. Fighting a framework's abstractions there
  costs more than the CRUD savings; visual identity constrained.

**Trade-off summary:** B costs one-time setup and dual-app upkeep during migration, and buys the
clean-slate design, modern table/palette/form kit, static-file deploy continuity, and the module-
by-module cutover. A is a rewrite in disguise; C adds server ops for no admin benefit; D wins only
for CRUD-heavy panels, which this is not.

**Decision:** ✅ Accepted as recommended (2026-07-10).

### D1.1 Sub-decisions (if B)
- **Repo placement**: `apps/admin` in the new monorepo (see D0).
- **Auth**: the new api issues the same-shape JWT against the same users collection, so one login
  works against either service during migration. Keep Bearer initially; move admin to httpOnly
  cookie + CSRF when RBAC lands (D2) — mechanical change, don't block Phase 1 on it.
- **State**: TanStack Query for all server state; component state + a small zustand store for UI
  concerns (sidebar, palette, picking checkoffs). **No Redux.**
- **Old app freeze**: from Phase 1, the CRA admin gets bugfixes only.

---

## D2. RBAC scope

### Options

**A) Stay single-admin (`isAdmin`)**
- ✚ Zero work.
- ✖ Every new v2 endpoint gets built without permission hooks → retrofitting means touching every
  route + service again; §18.4 of the requirements (the biggest industry-standard gap) stays open;
  the moment a second staff member needs restricted access you're blocked.

**B) ✅ Permission middleware now, one super-role, real roles later (Phase 8)**
- Build in Phase 1: `requirePermission('orders:write')`-style middleware + a permission-string
  catalog; `isAdmin` maps to all permissions. Every v2 route declares its permission from day one.
- ✚ ~1–2 days now; retrofit cost eliminated; RBAC UI in Phase 8 becomes "add roles collection +
  assignment screen", touching no route code. Frontend can hide nav/actions by permission from
  the start.
- ✖ Permission catalog must be designed carefully now (granularity: per-module read/write +
  sensitive verbs like `refunds:approve`, `stock:adjust`, `settings:write`).

**C) Full RBAC immediately (roles, assignment UI, sessions, 2FA)**
- ✚ Done once.
- ✖ Delays Phase 1/2 (the highest-value ops screens) for governance features a possibly-single-user
  team won't exercise yet; role design is better informed after the new modules exist.

**Trade-off summary:** the expensive part of RBAC is retrofitting checks, not building the roles UI.
B pays the cheap part now and defers the rest until the surface it governs exists.

**Decision:** ✅ Accepted as recommended (2026-07-10).

---

## D3. Design language

### Options

**A) Adopt a full design system (MUI v6 / Ant) as-is**
- ✚ Fast start, mature components.
- ✖ Generic look (explicitly what this revamp wants to escape); theme fights for a distinct
  identity; heavier bundles; table/palette still need custom work.

**B) ✅ Token-first custom language on shadcn/Tailwind primitives**
- Define once, in code, before any screen: color tokens (semantic, light+dark), spacing/type scale,
  density rules, and the **status-badge taxonomy**.
- ✚ Owned components (copied in, editable), distinct identity, dark mode nearly free if tokens come
  first, tokens shared with the dataviz palette.
- ✖ Requires the discipline of writing the taxonomy/tokens before building screens (Phase 0 output,
  not an ongoing cost).

**C) Fully bespoke design system from scratch**
- ✖ Months of foundation work before the first screen; unjustified for an internal ops tool.

**Status taxonomy (the one hard deliverable here)** — map every domain state to ~6 semantic tones so
the whole admin speaks one color language, e.g.:
- `neutral` (draft/received/initiated) · `info` (in-progress: confirmed/processing/in-transit/QC) ·
  `warning` (attention: NDR, low stock, partial payment, pickup failed, stale) ·
  `success` (delivered/paid/completed/in-stock) · `danger` (canceled/rejected/RTO/out-of-stock/overdue) ·
  `accent` (exchange/replacement/featured).
Every module's badges resolve through this map — no per-screen color choices.

**Other calls bundled here:** dark + light from day 1 (token cost only); density = compact tables /
comfortable forms; WCAG AA floor; one icon set.

**Decision:** ✅ Accepted as recommended (2026-07-10).

---

## D4. API versioning & compatibility

Constraint: **two clients share this API** — the Next.js storefront (must not break) and the admin.

### Options

**A) Evolve v1 in place with shims, no version prefix**
- ✚ No routing ceremony.
- ✖ Contract changes (FSM status endpoint, unified list contract, error envelope) silently reach
  the storefront; "temporary" shims with no version boundary tend to become permanent; hard to know
  when old behavior is safe to delete.

**B) ✅ The new repo IS v2 — version at the service boundary**
- With D0, versioning falls out naturally: the new api serves `/api/v2/...`, nginx proxies it to
  the new service, and the legacy service keeps serving `/api/...` unchanged for the old admin +
  storefront. No shims inside the legacy codebase at all — coexistence is handled by the
  single-writer + write-compatibility rules in D0 instead.
- ✚ Legacy repo stays nearly frozen (bugfixes only); storefront fully isolated; per-domain cutover
  = an nginx/env change + admin pointing at v2; rollback = point back.
- ✖ During transition some flows span services (e.g. new admin reads an order domain still owned by
  legacy) — either proxy those reads through the new api or tolerate the old contract in the new UI
  temporarily; be explicit per phase about which.

**C) Header/date-based versioning**
- ✖ Over-engineered for two first-party clients.

**Decision:** ✅ Accepted as recommended (2026-07-10).

---

## D5. Backend foundation choices (smaller, but decide once)

| Choice | Options | Recommendation & trade-off |
|---|---|---|
| Runtime validation | zod vs joi | ✅ **zod** — schemas double as TS types shared across `packages/schemas` → api → admin (joi is runtime-only). |
| Backend language | JS vs TS | ✅ **TypeScript** — the "don't churn a working codebase" argument dies with the new repo (D0). Greenfield TS costs nothing extra, and the shared-DB contract in `packages/schemas` is exactly where compile-time types earn their keep (FSM charts, permission catalog, event payloads). Trade-off: build step + team familiarity vs type safety across the whole monorepo; port legacy logic file-by-file as modules move over rather than converting in place. |
| Job queue | BullMQ (Redis) vs Agenda (Mongo) | ✅ **BullMQ** — Redis already in the stack; actively maintained; repeatables, retries with backoff, DLQ built in. Trade-off: job durability depends on Redis persistence config — verify AOF/RDB settings on the server as part of Phase 2 setup. Agenda would keep everything in Mongo but is maintenance-sparse and slower. |
| Test runner | keep `node --test` | ✅ Keep — already proven in the returns module; zero new deps. FSM charts are table-testable with it. |
| Process model | workers in-process vs separate | Start BullMQ workers **in the same process** (simplest deploy), extract to a separate PM2/systemd worker process when queue volume justifies it. Trade-off: in-process is simpler but a worker crash-loop can affect the API; revisit at Phase 3 exit. |

---

## D6. PDF generation (invoices & billing documents)

Context: today PDFs exist in **two client-side systems** — order invoices via `@react-pdf/renderer`
(React components compiled to PDF in the browser) and billing documents via an HTML print template +
`window.print()`. Consequences: the backend can't attach an invoice to an email or store a canonical
copy (`pdfUrl` fields exist but nothing fills them), documents render slightly differently per
browser, and layout logic is welded to UI code. Decision: generate PDFs **server-side, once, in the
new api** — the only question is which library.

### Options

**A) Keep `@react-pdf/renderer`** — rejected (user call, and rightly): ~1MB+ of frontend bundle,
React-specific layout DSL, client-only (no email attachments, no stored canonical copy), a second
rendering path forever.

**B) ✅ pdfmake (server-side)**
- Declarative JSON document definitions (tables, columns, styles) built on pdfkit; pure JS, no
  native deps, no browser; runs in the same Node process; an invoice renders in milliseconds.
- ✚ The right altitude for structured business documents (item tables, totals, GST breakup,
  headers/footers, page numbers); one `DocumentPdfService` serves all 7 document types (order
  invoice + 6 billing types); document definitions are plain data — unit-testable; ~small dep
  footprint; embedded fonts for the ₹ glyph work out of the box.
- ✖ Layout is code, not CSS — the print-CSS look must be rebuilt once as a document definition;
  pixel-perfect parity with the current HTML template isn't the goal (the revamp is redesigning
  documents anyway).

**C) pdfkit directly**
- ✚ Even lighter, maximum control.
- ✖ Imperative x/y drawing — you hand-build table layout, wrapping, page breaks. For invoice-style
  documents that's exactly the code pdfmake already wrote. Only worth it if pdfmake's layout model
  proves too rigid.

**D) Headless-Chromium HTML→PDF (Puppeteer/Playwright, or Gotenberg as a sidecar)**
- ✚ Pixel-perfect reuse of HTML/CSS templates; the "just print the web page" model.
- ✖ Not lightweight in any sense: ~300MB Chromium on the server, ~100–300ms+ and significant RAM
  per render, browser lifecycle management, another thing to patch. Industry-common, but overkill
  for structured invoices; the fidelity advantage only matters when marketing-grade layout is
  required.

**Trade-off summary:** B gives one canonical, backend-owned renderer at the cost of re-expressing
the document layout once; C trades pdfmake's table engine for control you don't need; D trades
340MB of infrastructure for CSS reuse you're discarding in a redesign anyway.

**Consequences of B (fold into phases):**
- New api gets `DocumentPdfService` (Phase 2 for order invoices, Phase 6 for billing docs);
  endpoints stream the PDF (`GET /:id/pdf`); `pdfUrl`/`pdfGeneratedAt` finally get populated for
  stored copies.
- The admin UI just links/downloads — no PDF code in the frontend at all; the billing print view
  can remain a simple HTML page for quick physical printing, but the **canonical artifact is the
  server PDF**.
- Unlocks §18.5's notification center: invoice/credit-note PDFs attachable to transactional emails.

**Decision:** ✅ Accepted — B (pdfmake, server-side) (2026-07-10).

---

## Suggested decision order

1. **D1 (stack)** — blocks all Phase 1 UI work.
2. **D2 (RBAC scope)** — blocks Phase 1 backend middleware.
3. **D4 (versioning)** — blocks the first v2 endpoint.
4. **D3 (design tokens/taxonomy)** — blocks the first styled component; can run in parallel with 1–3.
5. **D5** — folded into Phase 1 setup PRs.
6. **D6 (PDF)** — needed by Phase 2 (order invoice download); doesn't block Phase 1.
