## REMINDER
- server-side pagination for records list
- server-side input validation
- user authentication
- make error messages appear as popup notification
- disallow deletion for policies and insurance providers
- disable editing for read-only fields
    + merrecord details: policy


## IMPROVEMENTS
- connect phone system to application:
    + launch calls from UI,
    + save phone log in database,
    + record calls option,
    + infer caller during record creation,
- e-mailing documents from the application:
    + outgoing e-mails to selected clients,
    + incoming from insurance companies,
- AI assistant,
- location matching between service providers and accident place
- data archiving
- user actions audit


## NEEDS
- current data model, required for migration.
- how will data migration from cuurrent server happen?
- what is the current printing solution? can it be re-used?
- how are subsequent services known? through phone calls?
- how do you decide which service provider to send? location heuristics?
- delta files structures (both).
- can a client exist in the list but have no corresponding policy?
- all causes/scenarios of policy invalidity.
- are brokers and agents just informational?
- can record policy and type be updated?
- all document types.