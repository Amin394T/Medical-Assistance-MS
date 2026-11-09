## WORKFLOWS
- workplace accident declaration :
    1. medical record is created:
        + emergency phone call received from a client company ;
        + caller provides a valid insurance policy ;
        + initial data about the accident, company, and victim are recorded ;
    2. medical intervention is sent:
        + service providers (ambulances, doctors...) are called and directed to the accident place ;
        + intervention service data are added to the medical record ;
    3. medical documents are generated:
        + medical record report is printed and added to a physical record ;
        + medical coverages are sent to relevant service providers (hospitals, pharmacies...), then printed and added to the physical record.

- workplace accident follow-up :
    + follow-up e-mails and phone calls are made with the client company and service providers ;
    + subsequent medical services (medicines, treatments, check-ups...) are added to the medical record ;
    + new medical coverages are generated, sent, and printed ;
    + medical certificates (initial, prolongation, aggravation, healing ...) received from hospitals or regulatory physician are added to the medical record ;
    + medical record is closed when settled or abandonned.

- policy verification :
    + hospital calls and provides a client's insurance policy number ;
    + policy verification medical record is created (for billing reasons) ;
    + record's validity, which depends of the policy's status, is communicated to the caller ;
    + if the policy is invalid, a notification e-mail is sent to the insurance provider.

- delta files loading:
    + insurance company periodically sends latest client policies spreadsheet,
    + Excel file includes policy, client, effective date, insurer, intermediary, and status columns (intermediary may be blank) ;
    + file is processed to create new policies and update exisiting policies' statuses.

- rejected records revalidation :
    + when the client's policy is invalid, assistance is still provided but the client pays the service providers ;
    + client settles his contract with the insurance provider ;
    + new policy status is received in newer delta files ;
    + medical record is automatically validated and its processing is resumed.

- service billing:
    + batch of physical files is periodically provided to the billing manager ;
    + costs for services are added to each medical record ;
    + records that are ready are selected for billing ;
    + invoices are generated and printed for each record, including medical record creation fee ;
    + financial settlements are processed with the service providers ;
    + payments are then collected from the insurance companies.

- legal procedure:
    + victim challenges an insurance decision in court (generally disability compensation);
    + concerned mediacl record' status becomes "in dispute", and is excluded from the list of billable records until the dispute is resolved.


## SCREENS
- record management :
    + emergency call : form used to collect data from calls, creates medical records ;
    + medical records : list of medical records, sorted by date, column filters (reference, policy, company, victim, status, date), read-only ;
        + record details : form used to displays and edit a record full details, includes editable lists for sevices and certificates ;
- issurance management :
    + client policies : list of insurance policies, row filter, read-only ;
    + insurance providers: list of insurance companies, agents, brokers, and special clients, row filter, grid CRUD;
    + policy update : upload screen for delta files, updates policies (new + status change) ;
- service management :
    + healthcare providers : list of medical service providers, row filter, grid CRUD ;
    + medical services : list of medical services, row filter, grid CRUD ;
- billing management :
    + service settlement : list of billable medical services from valid records (with "in progress" status) and those that have already been billed,  row filter, edit-only, check-box with each row + button that creates an invoice per record (groups services from same record) for selected services ;
    + invoice cashing : list of cashings, row filter, read-only ;
        + cashing details : form used display, create, and edit a cashing of invoices, includes a list of invoices which, during creation, displays all non-cashed invoices for selection, while during edit, displays invoices that are linked to this cashing, read-only in both cases.


## DATA STRUCTURE
- medical record:
    // 1. client data:
    + reference: required, read-only, unique, defaults to calculated (accident date YYMMDD + daily 2-digits sequence) ;
    + insurance policy: required, selectable (list searchable by policy and client name) ;
    + client company: UI-only, read-only, inferred (from selected insurance policy) ;
    + insurance provider: UI-only, read-only, inferred (from selected insurance policy, insurance company + intermediary between brackets if available) ;
    + reporting date: required, date-time, defaults to NOW ;
    + reporter name ;
    + reporter phone: required ;

    // 2. accident data:
    + accident date: required, date-time, defaults to NOW ;
    + accident type: required, list (workplace accident - AT, illness & pain - MD, policy verification - VF, special service - SS, occupational disease - PR), defaults to "AT" ;
    + accident place: required, list (workshop - WS, route - RT, office - OF, construction - CT) ;
    + accident cause: list (falling or slipping - FALL, machine or equipment - EQIP, overexertion and fatigue - FATG, hazardous substance - HAZD, workplace violence - VIOL, moving objects - OBJC) ;
    + accident evolution: required, list (initial - INIT, relapse - RELP, death - DEAT, complement - COMP), defaults to "INIT" ;

    // 3. victim data:
    + victim first name: required ;
    + victim last name ;
    + victim phone ;
    + victim national ID: required ;
    + victim job ;

    // 4. status data (hidden in "/assistance/call"):
    + status: required, list (in progress - PRG, disputed - DSP, rejected - RJC, closed - CLS, abandoned - ABN), defaults to calculated (if a non-cancelled suspension or termination status exist, then "RJC", esle "PRG") ;
    + delegation date: date-time ;
    + regulatory doctor ;
    + manager: required, read-only, defaults to USER ;
    + observation ;
    + last updated: required, read-only, date-time, defaults to NOW, automatically updated at modification time ;
    + last updater: required, read-only, defaults to USER ;

- medical service:
    + record: required, selectable (displays accident type - reference) ;

    // 1. service data:
    + service provider: required, selectable (displays service provider name and profile) ;
    + service type: required, selectable (from service type, those corresponding to the selected service provider's profile) ;
    + date: date ;
    + observation ;
    + settlement status: required, read-only, list (waiting - WAIT, billed - BILL, settled - SETT), defaults to "WAIT" ;
    + settling date: date, read-only ;
    
    // 2. payment data (hidden in "/assistance/records/:id"):
    + invoice: selectable (from invoices. displays reference) ;
    + payment amount: required, number, defaults to calculated (service type's "payment amount") ;
    + billing amount: required, number, defaults to calculated (service type's "billing amount") ;
    + tax rate: required, number, defaults to calculated (service type's "tax rate") ;
    + bank: combo-box ;
    + payment mode: list (check - CHQ, transfer - VRM, cash - CSH) ;
    + payment reference ;

- medical certificate:
    + record: required, selectable, hidden ;
    + type: required, list (initial - INIT, prolongation - PROL, return - RETU, aggravation - AGGR, inspection - INSP, recovery - RECO) ;
    + service provider: selectable (displays service provider name) ;
    + day count: required, number ;
    + start date: date ;
    + end date: date ;
    + observation ;

- insurance provider:
    + label: required, unique ;
    + corporate id ;
    + type: required, list (company - CMP, agent - AGT, broker - BRK, special - SPC) ;
    + phone ;
    + email ;
    + balance: number ;

- insurance policy (entirely read-only):
    + policy number: required, unique, read-only ;
    + client company: required, read-only ;
    + effective date: required, date, read-only ;
    + status: required, read-only, list (valid - VALI, resumed - RESU, suspended - SUSP, terminated - TERM) ;
    + insurance company: required, read-only, selectable ;
    + intermediary: read-only, selectable (from insurance provider where type is "AGT" or "BRK") ;·
    + creation date: required, read-only, date-time, defaults to NOW ;
    + last updated: required, read-only, date-time, automatically updated at modification time ;

- service type:
    + label: required, unique ;
    + payment amount: required, number, defaults to 0 ;
    + billing amount: required, number, defaults to 0 ;
    + tax rate: required, number, defaults to 0 ;
    + target profile: required, combo-box ;

- service provider:
    + label: required, unique ;
    + corporate name ;
    + profile: required, selectable (distinct values of column "target profile" from "service type") ;
    + contact name ;
    + phone: required ;
    + email ;
    + bank: combo-box ;
    + bank account ;

- billing invoice :
    + record: required, selectable ;
    + reference: required, read-only, unique, defaults to calculated (current year date YYMM + yearly 6-digits sequence) ;
    + issue date: required, read-only, date, defaults to NOW ;
    + total amount: required, number ;
    + cashing: optional, selectable ;

- billing cashing :
    + insurance provider: required, selectable ;
    + request date: required, read-only, date, defaults to NOW ;
    + total amount: required, number ;
    + bank: combo-box ;
    + payment mode: list (check - CHQ, transfer - VRM, cash - CSH) ;
    + payment reference ;
    + cashed: boolean ;
    + cashing date: date ;
