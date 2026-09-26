## WORKFLOWS
- workplace accident declaration:
    1. medical record is created:
        + emergency phone call received from victim's company,
        + caller provides a valid insurance policy or already has one registered,
        + initial data about the accident, reporter, victim are recorded,
    2. medical intervention is sent:
        + service providers (ambulances, doctors...) are called and directed to the accident place,
        + intervention service data are added to the medical record,
    3. medical documents are generated and printed:
        + medical record file initiates the physical record,
        + medical coverage are sent to relevant service providers (hospitals, pharmacies...),

- workplace accident follow-up (TO VERIFY & DETAIL):
    + follow-up incoming and outgoing calls are made,
    + subsequent medical services (medicine, treatments, check-ups, relapse...) are added to the record,
    + new medical documents (coverges, certifictes...)
    + record is closed when settled or abandonned,

- special service request (TO COMPLETE):
    + ?

- policy verification (TO COMPLETE):
    + ?

- delta files handling:
    + insurance company periodically sends latest client policies spreadsheet,
    + file is uploaded to system, policies are added or their status is updated,

- data report sending:
    + insurance company requests a report by email,
    + report is generated and sent by email,
    
- rejected records revalidation (TO COMPLETE):
    + ?

- insurance records delegation (TO COMPLETE):
    + ?


## SCREENS
- record management:
    + emergency call: form used to collect data from calls, creates medical records,
    + medical records: list sorted by date, filter available for most visible columns,
    + record details: form to visualize all record data, includes editable lists for sevices and documents,
- issurance management:
    + client policies: list of insurance policies, row filter,
    + insurance providers: editable list of insurance companies, agents, brokers, row filter,
    + policy update: delta file upload screen, updates policies (new + status change),
- service management:
    + healthcare providers: editable list of medical service providers, row filter,
    + medical services: editable list of medical services, row filter,


## TECHNICAL STAKES
- deployed on-premise,
- open-source technologies only, free to use and host,
- data volume is relatively small, few thousands of medical records per year,
- remaining data are short referencial lists (service providers, insurance providers, ...),
- archiving of records and documents,
- delegate heavy work to the server, keep the minimum on users machines,
- target platform is desktop, accessible from LAN,
- document printing is essential,
- concurrency is not a big concern, only few users,
- data migration from spreadsheets to DB expected,
- standard authentication with no user types or permissions,


## DATA STRUCTURE
- medical record:
    // record data:
    + reference: read-only, generated (record type AT/MD/VF/SS/PR + accident date YYYYMMDD + daily 2-digits sequence),
    + record type: list (workplace accident - AT, illness & pain - MD, policy verification - VF, special service - SS, occupational disease - PR), defaults to "AT",
    + insurance policy: required, selectable (list searchable by policy and client name),
    + client company: required, inferred (from selected insurance policy),
    + insurance company: read-only, inferred (from selected insurance policy),
    + intermediary: read-only, inferred (from selected insurance policy),
    // report data:
    + reporting date: required, date-time, defaults to "NOW",
    + reporter first name: required,
    + reporter last name: optional,
    + reporter phone: required,
    + accident place: required, list (workshop - WS, route - RT, office - OF, construction - CS),
    // victim data:
    + accident date: required, date-time, defaults to "NOW",
    + accident cause: optional, list (falling or slipping - FALL, machine or equipment - EQIP, overexertion and fatigue - FATG, hazardous substance - HAZD, workplace violence - VIOL, moving objects - OBJC),
    + victim first name: required,
    + victim last name: required,
    + victim phone: optional,
    + victim national ID: required,
    + victim job: optional, combo-box,
    // evolution data:
    + accident evolution: required, list (initial - INIT, delegation - DELG, relapse - RELP, death - DEAT, complement - COMP), defaults to "INIT",
    + delegation date: optional, date-time,
    + coverage issued: boolean,
    + coverage date: optional, date,
    + regulator: optional, selectable (from service providers with type "REGULATOR"),
    // status data
    + record status: list (in progress - PROG, settled - SETT, closed - CLOS, abandoned - ABAN, billed - BILL), defaults to "PROG",
    + record fate: read-only, inferred (from policy validity, either "Approved" if valid, else "Rejected"),
    + fate reason: read-only,
    + last action: read-only, date-time, defaults to "NOW",
    + managed by: read-only, defaults to "USER",
    + observation: optional,

- medical record service:
    + record: required, selectable,
    + service provider: required, selectable,
    + service type: required, selectable (from service type, those corresponding to service provider profile),
    + mission date: optional, defaults to "NOW",
    + mission place: optional,
    + observation: optional,

- medical record document:
    + record: required, selectable,
    + type: required, combo-box,
    + service provider: required, selectable,
    + observation: optional,
    + signed: boolean,

- insurance provider:
    + label: required, unique,
    + corporate name: optional,
    + corporate id: optional,
    + type: required, list (company - CMP, agent - AGT, broker - BRK),
    + phone: optional,
    + email: optional,

- insurance policy:
    + policy number: required,
    + client company: required,
    + effective date: required,
    + insurance company: required, selectable,
    + intermediate: optional, selectable (from insurance provider where type is "AGT" or "BRK"),
    + terminated: boolean,
    + termination date: optional,
    + type: required, list (revisable - REV, fixed-rate - FIX),
    + created at: read-only, defaults to NOW,
    + updated at: read-only, automatically updated at modification time,

- service type:
    + label: required
    + target profile: required, combo-box,

- service provider:
    + label: required, unique,
    + corporate name: optional,
    + profile: required, selectable (distinct values of column "target profile" from "service type")
    + contact name: optional,
    + phone: required,
    + email: optional,