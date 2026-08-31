## DESCRIPTION
- application used by medical assistance providers,
- manages workplace accidents and subsequent medical needs:
    + emergency calls are received from client companies of contracted insurance companies,
    + medical intervention (ambulances, doctors, pharmacies...) are requested by phone,
    + medical coverage papers are printed and sent to medical entites (hospitals, pharmacies, ...),
    + follow-up incoming and outgoing calls are made until the case is emergency is settled,
- everything is recorded and traced in a medical record:
    + opened at the initial phone call,
    + enriched with further medical services (medicine, treatments, check-ups, relapse...),
    + closed when emergency is settled,


## WORKFLOW
- workplace accident management:
    + emergency phone call received from insurance client,
    + client must provide valid insurance policy or have one already registered and still valid,
    + medical record opened with initial data about the accident, reporter, victim,
    + medical intervention is called and directed to the accident place,
    + medical coverage documents are generated, printed, sent to medical entites,
    + follow-up calls are made when needed,
    + subsequent medical services are added to the record,
    + record is closed when settled or abandonned,
- insurance company exchanges
    + insured clients and policies are loaded from spreadsheets sent periodically by insurance companies,
    + reports are generated and sent to insurance companies,


## SCREENS
- medical record management:
    + declaration form, used to collect data from call,
    + list, sorted by date and shows open records by default,
    + details form, for follow-up, includes sevices list and documents list,
    + history, shows record actions (updates, services, documents, ...)
- referential lists, editable lists with filters:
    + medical service providers, full CRUD,
    + insurance companies, brokers, agents, full CRUD,
    + insured clients, loaded from delta spreadsheet,
    + insurance policies, loaded from delta spreadsheet,


## TECHNICAL STAKES
- deployed on-premise at insurance company, access provided by computer,
- open-source technologies only, free to use and host,
- data volume is relatively small, few thousands of medical records per year,
- remaining data are short referencial lists (services, clients, insurances, ...),
- archiving of records and documents,
- delegate heavy work to the server, keep the minimum on users machines,
- target platform is desktop, accessible from LAN,
- document printing is essential,
- concurrency is not a big concern, only few users,
- data migration from spreadsheets to DB expected,
- standard authentication with no user types or permissions,


## TECHNOLOGY CHOICES
- front-end: React + TypeScript
- form handling: TanStack Forms + Zod
- table handling: TanStack Table + TanStack Query
- routing: NextJS router
- style: Tailwind
- UI components: shadcn/UI
- back-end: NextJS + RSC + TypeScript
- runtime: NodeJS
- ORM: Drizzle
- DB: SQLite + file system


## DATA STRUCTURE
- medical record
    // record data:
    + accident date: required, default to NOW,
    + insurance policy: required, read-only infered from client company (latest valid policy),
    + insurance company: read-only, infered from policy,
    + reference number: read-only, generated (AT/MD/SP + YYMMDD + daily sequence),
    + client company: required, selectable, infered from insurance policy when typed manually,
    + record type: list (normal, verification), defaults to "normal",
    // report data:
    + reporting date: max NOW, defaults to NOW,
    + reporter first name: required,
    + reporter last name: optional,
    + reporter phone: required,
    + accident type: optional, list (initial, relapse, sickness),
    + initial accident: required when accident type = relapse, selectable from reference numbers of other client records
    + accident place: required, list (workshop, route, office, site),
    // victim data:
    + victim first name: required,
    + victim last name: required,
    + victim national ID: required,
    + victim phone: optional,
    + accident cause: optional, list (falling or slipping, machine or equipment, overexertion and fatigue, hazardous substance, workplace violence, moving objects),
    // tracking data:
    + record status: list (in progress, settled, closed, abandoned, billable), defaults to "in progress",
    + record fate: list (waiting, approved, rejected, abandoned), defaults to "waiting",
    + fate reason: optional, list (suspended policy, cancelled policy, absent coverage, unsigned coverage, ?)
    + intermediate: optional, selectable from insurance provider where type is "agent" or "broker",
    + managed by: read-only, defaults to application user,
- medical service:
    + service: required,
    + provider: required, selectable,
    + mission date: read-only, defaults to NOW,
    + mission place: optional,
    + observations: optional,
    + settled: boolean,
- medical document:
    + type: required, list (record details, coverage, others),
    + last printed: read-only, automatically updated at printing time,
    + observations: optional,
    + signed: boolean,
- insurance provider:
    + label: required, unique,
    + company name: optional,
    + company id: optional,
    + type: required, list (company, agent, broker),
    + phone: optional,
    + fax: optional,
    + email: optional,
- insurance client:
    + label: required, unique,
    + name: optional,
    + sector: optional,
    + phone: required,
    + fax: optional,
    + email: optional,
- insurance policy:
    + policy number: required,
    + client company: required, selectable,
    + effective date: required,
    + insurance company: required, selectable,
    + intermediate: optional, selectable from insurance provider where type is "agent" or "broker",
    + terminated: boolean,
    + termination date: optional,
    + type: required, list (revisable, fixed-rate),
    + created at: read-only, defaults to NOW,
    + updated at: read-only, automatically updated at modification time,
- service provider:
    + label: required, unique,
    + name: optional,
    + profile: required, list (ambulance, general practitioner, emergency physician, resuscitator, diabetologist, ?)
    + worker name: optional,
    + phone: required,
    + fax: optional,
    + email: optional,