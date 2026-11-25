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
- Primary keys are not mentionned, should be "id" for all tables ;
- Do not create extra columns, like created_at and update_at, other than "id" ;
- "selectable" means that its a foreign key, add "_id" to the name, if the foreign table is not specified, then it most-likely has the same name as the column ;
- "list" means an enumeration, values are those separated by comma, when a value contains 2 parts separated by dash, the second part is the DB value, while the first is the UI display value ;
- "UI-only" indicates that the field is not a table column, rather it is fetched with joins, and is automatically read-only ;
- "combo-box" is a UI directive, does not indicate an enumeration ;
- "read-only" is a UI directive, the field can still be set, just not by the user from the UI ;
- "boolean" columns are not required, defaults to FALSE, NULL is equivalent to FALSE ;
- "NOW" means current date + time ;
- "USER" means current application user, a UI directive, do not put any default value at schema level ;
- "date-time" means date with time ;
- "date" means date without time, but still stored as timestamp like date-time ;
- "defaults to" should not be treated as a table column constraint unless the field is also "read-only" or hidden at creation. additionally, the default value should display in the UI forms if the field is visible, while being editable unless it's a "read-only" field ;
- "audit" means the column should be updated at modification, with the user or time of modification ;
- "hidden" is a UI directive, it means the field or group of fields are not to be displayed ;
- if "required" is not meantionned, then the field is optional ;
- if the type is not mentionned, then the field is of text type ;

<!-- DB-data-structure:end -->



<!-- UI-design-directives:start -->

Find the screens description in `README.md`, in the "SCREEN DESCRIPTION" section.

About generale template:
- side-bar menu, branding on the top, user info at the bottom, navigation entries in between ;
- page header has page title, above it page domain, opposit of it an icon ;

About form pages:
- Forms should spread fields on a 3 columns grid ;
- init-cap field labels ;
- required fields are marked with a green asterisk right of the label ;

About table pages:
- by default, all table columns are displayed except the primary key, unless shown columns are explicitly specified ;
- init-cap table column labels ;
- sorting is available for all columns ;
- row filtering by default unless custom column filters are specified ;
- a "reset grid" button should be on the opposite side of the row filter bar, used to reset sorting and filtering ;
- a "create" button should be to the right of the "reset" button ;
    + upon clicking, a new empty row should appear as the first row, with save and delete buttons similar to those that appear when editing ;
    + clicking on "delete" cancels the creation immediatly ;
- editable tables display and "edit" button at the start of each row ;
    + clicking the edit row button transforms columns into fields ;
    + the "edit" button turns into "save", "cancel", and "delete" buttons ;
    + deleting only marks the row for deletion, until "save" is pressed ;
- date range filters should be 2 date fields side by side in the same column, like 2 fields in 1 ;
- table columns should be in the same order they're mentionned ;
- editable grids have full CRUD unless otherwise is specified ;
- displaying all columns does exclude the primary key, unless otherwise is specified ;

About data display:
- medical record reference should have record type folowed by dash prepended, and a dash inserted before the sequence part, ending up with this display format TYPE-YYMMDD-SEQ (ex: AT-261109-03) ;
- date format should be DD-MM-YYYY, while time format should be HH24:MI:SS ;



<!-- UI-design-directives:end -->



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