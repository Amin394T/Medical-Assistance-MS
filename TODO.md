## REMINDER
- reference number should use dash as separator and sequence should have 2 digits only
- add server side pagination to records list
- update record reference when date or type change
- show policy status near policy number and color-code it
- add input field validation


## IMPROVEMENTS
- connect phone system to application:
    + launch calls from UI,
    + save phone log in database,
    + record calls option,
    + infer caller during record creation,
- e-mailing documents from the application,
- AI assistant,
- geo-localisation of service providers and client companies
    + nearest ambulances are sent + to nearest hospital
- data archiving
- user actions audit


## NEEDS
- current data model, required for migration
- how are subsequent services known? through phone calls?
- what is the current printing solution? can it be re-used?
- how to process delta files (when to add, update, remove)?
- how will data migration happen?
- get full list of medical services, and service profiles,
- how do you decide which service provider to send
- how are policy beneficiaries stored
- all causes/scenarios of policy invalidity
- are brokers and agents just informational
- can policy and record type be updated
- get document types