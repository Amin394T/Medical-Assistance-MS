<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->



<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:
- Run `npx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->



<!-- DB-data-structure:start -->

Find the tables definitions in `README.md`, in the "DATA STRUCTURE" section.

Things to keep in mind:
- Primary keys are not mentionned, should be "id" for all tables,
- Do not create extra columns, like created_at and update_at, other than "id",
- "selectable" means that its a foreign key, add "_id" to the name,
- "list" means an enumeration, values are those separated by comma, when a value contains 2 parts separated by dash, the second part is the DB value, while the first is the UI display value,
- "inferred" is a UI directive, does not indicate that the column is a foreign key,
- "UI-only" indicates that the field is not a table column, rather it is fetched with joins,
- "combo-box" is a UI directive, does not indicate an enumeration,
- "read-only" is a UI directive, the field can still be set, just not from the UI,
- "boolean" columns are not required, NULL is equivalent to FALSE,
- "NOW" means current date + time,
- "USER" means current application user, a UI directive,
- "date-time" means date with time (up to seconds), while "date" means date without time,

<!-- DB-data-structure:end -->



<!-- Tech-stack:start -->

These are the technology choices for this project:
- front-end: React + TypeScript
- form handling: TanStack Forms + Zod
- table handling: TanStack Table
- data fetching: TanStack Query
- routing: NextJS app router
- style: Tailwind
- UI components: (NONE)
- back-end: NextJS + RSC + TypeScript
- runtime: NodeJS
- ORM: Drizzle
- DB: SQLite + file system

<!-- Tech-stack:end -->