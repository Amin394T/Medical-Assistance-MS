## BUSINESS FLOWS
- workplace accident declaration :
    + emergency phone call received from a client company ;
    + caller provides a valid insurance policy for the victim ;
    + initial data about the accident, company, and victim are recorded ;
    + service providers (ambulances, doctors...) are called and directed to the accident place ;
    + intervention service data are added to the medical record ;
    + medical record file is printed and added to a physical record ;
    + medical coverage documents are sent to relevant service providers (hospitals, pharmacies...), then printed and added to the physical record.

- medical case follow-up :
    + follow-up e-mails and phone calls are made with the client company and service providers ;
    + subsequent medical services (medicines, treatments, check-ups...) are added to the medical record ;
    + new medical coverages are generated, sent, and printed ;
    + medical certificates (initial, prolongation, aggravation, healing ...) received from hospitals or regulatory physician are added to the medical record ;
    + follow-up ends when the medical record is closed or abandonned.

- policy verification :
    + hospital calls and provides a client's insurance policy number ;
    + policy verification medical record is created (for billing reasons) ;
    + record's validity, which depends of the policy's status, is communicated to the caller ;
    + if the policy is invalid, a notification e-mail is sent to the insurance provider.

- delta files loading:
    + insurance company periodically sends a spreadsheet of the latest client policies, and may send another containing an employee list for nominative policies ;
    + Excel file includes policy, client, effective date, insurance company, and status columns ;
    + file is processed to create new policies and update exisiting policies' statuses.

- rejected records revalidation :
    + when the client's policy is invalid, assistance is still provided but the client pays the service providers ;
    + client settles his contract status with the insurance provider ;
    + insurance provider calls and asks to resume record processing despite the invalid policy ;
    + medical record is revalidated and its processing is resumed ;
    + new policy status is received in newer delta files.

- legal procedure:
    + victim challenges an insurance decision in court (generally disability compensation) ;
    + concerned mediacl record' status becomes "in dispute".

- medical service billing:
    + batch of physical files is periodically provided to the billing manager ;
    + costs for services are added to each medical record ;
    + invoices are generated and printed for each record, including newly billed services ;
    + medical record creation fee is added if it's the first record invoice ;
    + invoices are sent to concerned insurance providers ;
    + outgoing invoices payments are then collected.

- service provider invoice settlement:
    + incoming invoices are received from service providers ;
    + invoices are entered into the system ;
    + once paid, corresponding services are marked as "settled".


## SCREEN DESCRIPTION
- emergency call :
    + domain: record management ;
    + content type: form for medical record, used for creation ;
    + displayed fields: only client data, accident data, victim data (as set out in DATA STRUCTURE), no status data, insurance policy drop-down list is searchable by policy number and client company ;
    + behavior: creation should redirect to the record details screen ;

- medical records :
    + domain: record management ;
    + content type: table of medical records, sorted by date, read-only ;
    + displayed columns: reference (formatted), insurance policy (as policy number), client company, insurance company, victim name (first and last name concatenated), victim national ID, accident date, status (color-coded), manager ;
    + filter: reference, policy number, client company, victim name, victim national ID, status (dropdown list), accident date (date range) ;
    + behavior: clicking on reference redirects to record details page ;

- record details :
    + domain: record management ;
    + content type:
        1. form for medical record, used for display and update ;
        2. table of services, filtered by medical record, sorted by date, editable, no filters ;
        3. table of medical certificates, filtered by medical record, sorted by date, editable, no filters ;
    + displayed fields / columns:
        1. for medical record: all, reference is displayed as the header title, last updater and last updated displayed inline under the form as "Modified by ... at ..." ;
        2. for services: all except record, payment amount, billing amount, and tax rate, service type drop-down list is searchable by type and profile ;
        3. for medical certificates: all except record;
    + behavior: update should scroll the page to the top, without any redirect ;
    
- client policies :
    + domain: issurance management ;
    + content type: table of insurance policies, sorted by status date, read-only ;
    + displayed columns: all, status color-coded ;
    + filters: policy number, client company, status (dropdown list) ;
    + behavior: clicking on type value "nominative" displays a dialog containing a list of employees covered by the selected insurance policy with a search bar in the top ;

- insurance providers :
    + domain: insurance management ;
    + content type: table of insurance providers, sorted by label, editable ;
    + displayed columns: all ;
    + filters: label ;
    + behavior: clicking on record fees value displays a dialog containing a list of all the record types and the record fee for each, the fees being editable ;

- policy update :
    + domain: insurance management ;
    + content type: form used for delta file upload ;
    + displayed fields: insurance provider (dropdown list displays the label), policy file upload, employee file upload, the first 2 are required ;
    + behavior: for the selected insurance provider, updates policies (new + status change), and overwrites covered employees for the selected insurance company only when an employee file is provided, no redirect ;

- healthcare providers :
    + domain: service management ;
    + content type: table of service providers, sorted by label, editable ;
    + displayed columns: all ;
    + filters: label, profile ;

- medical services :
    + domain: service management ;
    + content type: table of service types, sorted by target profile, editable ;
    + displayed columns: all ;
    + filters: label, tagert profile ;

- record billing :
    + domain: billing management ;
    + content type: table of invoices, with a creation button, read-only;
    + displayed columns: all ;
    + filters: reference, record, cashed ;
    + behavior: clicking on new invoice redirects to invoice creation ;

- invoice creation :
    + domain: billing management ;
    + content type: table of services with no invoice attached, belonging to a medical record selected from a searchable dropdown list above the table, with a confirm button that creates and invoice for selected record, the columns payment amount, billing amount, and tax rate are editable ;
    + displayed columns: service type, provider, date, payment amount, billing amount, tax rate ;
    + behavior: clicking on confirm redirects to record billing ;

- service settlement :
    + domain: billing management ;
    + content type: list invoice settlements, with a creation button, read-only ;
    + displayed columns: all ;
    + filters: reference, service provider, reception date (date range), settled ;
    + behavior: clicking on new settlement or on the reference value redirects to settlement details ;

- settlement details:
    + domain: billing management ;
    + content type:
        1. form for invoice settlement, used for creation and update ;
        2. list of services, read-only, in creation mode display services belonging to settlement, in update mode display all services that do not belong to any settlement, ordered by date, with a checkbox on each row for selection ;
    + displayed fields / columns:
        1. for settlement form: all ;
        2. for service list: service type, provider, date, payment amount, billing amount, tax rate ;
    + filters: medical record's reference, provider ;
    + behavior: clicking on create creates the settlement and attach selected services to it, no redirect in both creation and update ;

- invoice collection :
    + domain: billing management ;
    + content type: list of invoice collections, with a creation button ;
    + displayed columns: all ;
    + filters: reference, insurance provider, request date (date range), collected ;
    + behavior: clicking on new collection or on the reference value redirects to collection details ;

- collection details :
    + domain: billing management ;
    + content type:
        1. form for invoice collection, used for creation and update ;
        2. list of invoices, read-only, in creation mode display invoices belonging to collection, in update mode display all invoices that do not belong to any collection, ordered by date, with a checkbox on each row for selection ;
    + displayed fields / columns:
        1. for collection form: all ;
        2. for invoice list: all ;
    + filters: medical record's reference ;
    + behavior: clicking on create creates the collection and attach selected invoices to it, no redirect in both creation and update ;


## DATA STRUCTURE
- medical record :
    // 1. client data:
    + reference: required, read-only, unique, defaults to (accident date YYMMDD + daily 2-digits sequence) ;
    + insurance policy: required, selectable (display "policy number") ;
    + client company: UI-only (inferred from selected insurance policy) ;
    + insurance provider: UI-only (inferred from selected insurance policy) ;
    + reporting date: required, date-time, defaults to NOW ;
    + reporter name ;
    + reporter phone ;

    // 2. accident data:
    + accident type: required, list (workplace accident - AT, illness & pain - MD, policy verification - VP, special service - SS, occupational disease - MP), defaults to "AT" ;
    + accident date: required, date-time, defaults to NOW ;
    + accident place: list (workshop - WKS, route - RUT, office - OFC, construction - CST) ;
    + accident cause: list (falling or slipping - FAL, machine or equipment - EQP, overexertion and fatigue - FTG, hazardous substance - HZD, workplace violence - VLC, moving objects - OBJ) ;
    + accident evolution: required, list (initial - INT, relapse - RLP, death - DTH, complement - CMP), defaults to "INT" ;

    // 3. victim data:
    + victim first name ;
    + victim last name ;
    + victim phone ;
    + victim national ID ;
    + victim job ;

    // 4. status data:
    + status: required, list (in progress - PRG, disputed - DSP, rejected - RJC, closed - CLS, abandoned - ABN), defaults to (if policy is not valid or is of nominative type but victim is not in the employees list, then "RJC", esle "PRG") ;
    + status reason: list (policy suspended - SPD, policy terminated - TRM, coverage limited - LMT), defaults to (depends on the policy status or if it's nominative the victim's absence from the employees list) ;
    + regulatory doctor ;
    + manager: required, read-only, defaults to USER ;
    + observation ;
    + last updated: required, read-only, date-time, defaults to NOW, audit ;
    + last updater: required, read-only, defaults to USER, audit ;

- medical certificate :
    + record: required, selectable (from medical records), hidden ;
    + type: required, list (initial - INIT, prolongation - PROL, aggravation - AGGR, ablation - ABLA, recovery - RECO, return - WORK, relapse - RELA) ;
    + service provider: selectable (displays "label") ;
    + compensation rate: number ;
    + day count: required, number ;
    + start date: date ;
    + end date: date ;
    + observation ;

- insurance provider :
    + label: required, unique ;
    + record fees: UI-only (inferred from corresponding insurance provider fee where "record type" is "AT") ;
    + phone ;
    + email ;

- insurance commission :
    + provider: required, selectable (from insurance provider, displays "label"), hidden ;
    + record type: required, list (workplace accident - AT, illness & pain - MD, policy verification - VP, special service - SS, occupational disease - MP), unique (per provider) ;
    + commission: number, required ;

- insurance policy (read-only) :
    + policy number: required, unique ;
    + client company: required ;
    + client activity ;
    + client address ;
    + client city ;
    + type: required, list (global - GLB, nominative - NMT) ;
    + status: required, list (valid - VLD, suspended - SPD, terminated - TRM) ;
    + status date: required, date ;
    + upload date: required, date-time, defaults to NOW ;
    + insurance company: required, selectable (displays "label") ;

- insurance coverage (read-only) :
    + policy: required, selectable (from insurance policy, displays "policy number"), hidden ;
    + employee: required ;

- service :
    + record: required, selectable, hidden;
    + service type: required, selectable (displays "label") ;
    + provider: required, selectable (from service providers, only those corresponding to the selected service type's "target profile") ;
    + date: required, date, defaults to NOW ;
    + place ;
    + observation ;
    + payment amount: required, number, defaults to (service type's "payment amount") ;
    + billing amount: required, number, defaults to (service type's "billing amount") ;
    + tax rate: required, number, defaults to (service type's "tax rate") ;
    + invoice: selectable (from invoices, displays "reference") ;
    + settlement: selectable (from invoice settlement, displays "settled") ;

- service type :
    + label: required, unique ;
    + payment amount: required, number, defaults to 0 ;
    + billing amount: required, number, defaults to 0 ;
    + tax rate: required, number, defaults to 0 ;
    + target profile: required, combo-box ;

- service provider :
    + label: required, unique ;
    + profile: required, selectable (from service type, distinct values of "target profile") ;
    + contact name ;
    + phone: required ;
    + email ;

- invoice :
    + reference: required, read-only, unique, defaults to (current year date YYMM + yearly 6-digits sequence) ;
    + record: required, selectable (from medical record, displays reference) ;
    + issue date: required, read-only, date, defaults to NOW ;
    + total amount: required, number ;
    + collection: selectable (from invoice collection, displays "collected") ;

- invoice settlement :
    + reference: required, read-only, unique, defaults to (current year date YYMM + yearly 4-digits sequence) ;
    + service provider: required, selectable (displays "label") ;
    - reception date: date, defaults to NOW ;
    + total amount: required, number ;
    + payment mode: list (check - CHQ, transfer - VRM, cash - CSH) ;
    + payment reference ;
    + bank: combo-box ;
    + settled: boolean ;
    + settlement date: date ;

- invoice collection :
    + reference: required, read-only, unique, defaults to (current year date YYMM + yearly 4-digits sequence) ;
    + insurance provider: required, selectable (displays "label") ;
    + request date: date, defaults to NOW ;
    + total amount: required, number ;
    + payment mode: list (check - CHQ, transfer - VRM, cash - CSH) ;
    + payment reference ;
    + bank: combo-box ;
    + collected: boolean ;
    + collection date: date ;