## REMINDER
- transform some enumerations into tables (service profiles, accident causes, ...),
- verify authentication in server actions,


## IMPROVEMENTS
- connect phone system to application:
    + launch calls from UI,
    + save phone log in database,
    + record calls option,
    + infer caller during record creation,


## QUESTIONS
- how many records per year? in total?
- how are subsequent services known? through phone calls?
- how are coverage documents sent to hospitals and pharmacies?
- is access provided to specific machines or through VPN or else?
- what is the current printing solution? can it be re-used?
- how to process delta files (when to add, update, remove)?
- what's the point of typing insurance policies if we have all clients and their policies?
- are there cases where we canstill create a record with an invalid policy? if no then why selectable?
- should we eliminate multi-insurance companies support?


## AMBIGUITIES
- medical records unkown fields,
- medical records unknown field values: accident causes, record fates,
- check other medical record children (certificates, refund, bills),
- get full list of medical services, and service profiles,
- check service assignement button in insurance companies and service providers,