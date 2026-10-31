## WORKFLOWS
- workplace accident declaration:
    1. medical record is created:
        + emergency phone call received from victim's company,
        + caller provides a valid insurance policy,
        + initial data about the accident, reporter, victim are recorded,
    2. medical intervention is sent:
        + service providers (ambulances, doctors...) are called and directed to the accident place,
        + intervention service data are added to the medical record,
    3. medical documents are generated and printed:
        + medical record report is printed and added to a physical record,
        + medical coverage are sent to relevant service providers (hospitals, pharmacies...), then printed and added to the physical record,

- workplace accident follow-up :
    + follow-up e-mails and phone calls are made with the client and service providers,
    + subsequent medical services (medicine, treatments, check-ups, relapse...) are added to the record,
    + new medical coverages are generated, sent, and printed,
    + received medical certificates are added to the record,
    + record is closed when settled or abandonned,

- policy verification :
    + hospitals call and provides a client's policy number,
    + a policy verification medical record is created,
    + the record's fate is communicated to the caller,
    + if the policy is invalid, an notification e-mail is sent to the insurance provider,

- delta files loading:
    + insurance company periodically sends latest client policies spreadsheet,
    + Excel file includes policy, client, effective date, insurer, intermediary, and status columns (intermediary may be blank),
    + status is VALID, SUSPENDED, or TERMINATED; new policies are added as revisable,
    + existing policies are not changed; a status history entry is added only when the latest non-canceled status differs,

- rejected records revalidation :
    + when the client's policy is invalid, assistance is provided but the client pays the service providers,
    + the client settles his contract with the insurance provider,
    + the insurance providers asks for medical record revalidation,
    + if the fate is valid, processing is resumed on the medical record,

- service billing:
    + a batch of physical files is periodically provided to the person in charge of billing,
    + the costs for services are added to each medical record,
    + records that are ready are selected for billing,
    + invoices are generated and printed, including medical record creation fee,
    + financial settlements are processed with the service providers,
    + payments are collected from the insurance companies,

- lawyer procedure (TODO):
    + ?


## SCREENS
- record management:
    + emergency call: form used to collect data from calls, creates medical records,
    + medical records: list sorted by date, filter available for most visible columns,
    + record details: form to visualize all record data, includes editable lists for sevices and certificates,
- issurance management:
    + client policies: list of insurance policies, row filter,
    + insurance providers: editable list of insurance companies, agents, brokers, row filter,
    + policy update: delta file upload screen, updates policies (new + status change),
- service management:
    + healthcare providers: editable list of medical service providers, row filter,
    + medical services: editable list of medical services, row filter,
- billing management:
    + service settlement: editable list sorted by date of provided medical services, row filter,
    + invoice management: editable list of invoices, row filter,


## DATA STRUCTURE
- medical record:

    // 1. client data:
    + reference: read-only, defaults to (accident date YYMMDD + daily 2-digits sequence),
    + insurance policy: required, selectable (list searchable by policy and client name),
    + client company: read-only, inferred (from selected insurance policy), UI-only,
    + insurance provider: read-only, inferred (from selected insurance policy, insurance company + intermediary between brackets if available), UI-only,
    + reporting date: required, date-time, defaults to NOW,
    + reporter name:
    + reporter phone: required,

    // 2. accident data:
    + accident date: required, date-time, defaults to NOW,
    + accident type: required, list (workplace accident - AT, illness & pain - MD, policy verification - VF, special service - SS, occupational disease - PR, lawyer procedure - AV), defaults to "AT",
    + accident cause: list (falling or slipping - FALL, machine or equipment - EQIP, overexertion and fatigue - FATG, hazardous substance - HAZD, workplace violence - VIOL, moving objects - OBJC),
    + accident place: required, list (workshop - WS, route - RT, office - OF, construction - CT),
    + accident evolution: required, list (initial - INIT, relapse - RELP, death - DEAT, complement - COMP), defaults to "INIT",

    // 3. victim data:
    + victim first name: required,
    + victim last name:
    + victim phone:
    + victim national ID: required,
    + victim job:

    // 4. status data (hidden at creation):
    + status: required, list (in progress - PRG, rejected - RJC, closed - CLS, abandoned - ABN), defaults to (if a non-cancelled suspension or termination status exist, then "RJC", esle "PRG"),
    + delegation date: date-time,
    + regulatory doctor: 
    + manager: required, read-only, defaults to USER,
    + observation:
    + last updated: required, read-only, date-time, automatically updated at modification time,
    + last updater: required,

- medical service:
    + record: required, selectable,
    + service provider: required, selectable,
    + service type: required, selectable (from service type, those corresponding to service provider profile),
    + service date: date,
    + fee amount: required, number, defaults to service type's "default fee",
    + billed amount: number,
    + tax rate: number,
    + billing status: required, list (waiting - WTN, billed - BLD, settled - STL),
    + settling date: date,
    + bank: combo-box,
    + payment mode: list (check - CHQ, transfer - VRM, cash - CSH),
    + payment reference:
    + invoice: selectable (from invoices)
    + observation:

- medical certificate:
    + record: required, selectable,
    + type: required, list (initial - INIT, prolongation - PRLG, return - RTRN, aggravation - AGRV, inspection - INSP, recovery - RCVR),
    + service provider: selectable,
    + days number: required, number,
    + start date: date,
    + end date: date,
    + observation:

- medical coverage (TODO):
    + ?

- insurance provider:
    + label: required, unique,
    + corporate id:
    + type: required, list (company - CMP, agent - AGT, broker - BRK, special - SPC),
    + phone:
    + email:
    + balance: number,

- insurance policy:
    + policy number: required,
    + client company: required,
    + effective date: required, date,
    + insurance company: required, selectable,
    + intermediary: selectable (from insurance provider where type is "AGT" or "BRK"),
    + type: required, list (revisable - REV, fixed-rate - FIX),
    + creation date: read-only, date-time, defaults to NOW,
    + last modified: read-only, date-time, automatically updated at modification time,

- insurance policy status
    + policy: required, selectable,
    + status: required, list (valid - VALID, suspended - SSPD, terminated - TRMN),
    + effective date: required, date,
    + update date: required, date, defaults to NOW,
    + cancelled: boolean,

- service type:
    + label: required,
    + default fee: required, number, defaults to 0,
    + target profile: required, combo-box,

- service provider:
    + label: required, unique,
    + corporate name:
    + profile: required, selectable (distinct values of column "target profile" from "service type")
    + contact name:
    + phone: required,
    + email:
    + bank: combo-box,
    + bank account:

- invoice:
    + date: read-only, date, defaults to NOW
    + total amount: required, number,
    + insurance provider: required, selectable,
    + bank: combo-box,
    + payment mode: list (check - CHQ, transfer - VRM, cash - CSH),
    + payment reference:
    + cashed: boolean,
    + cashing date: date,
