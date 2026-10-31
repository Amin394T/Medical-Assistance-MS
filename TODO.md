## REMINDER
- server-side pagination for records list
- server-side input validation
- user authentication
- make error messages appear as popup notification
- disallow deletion for policies and insurance providers
- disable editing for read-only fields
    + merrecord details: policy
- document printing from tables

- reporting date not read only and required
- record services or certificates modifications should update lastUpdated and lastUpdater
- replace USER with logged-in user


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
- medical coverages displayed like medical certificates


## NEEDS
- delta file(s) fields, list of beneficiaries
- details about lawyer procedure records
- certificates from hospitals only, regulating doctor?
- are brokers and agents just informational?
- go through reports
= why does poliy verification required a record

- remaining columns in certificates
- insurance company balance and treshold
- invoice per record or can have multiple
- is tax the same for all

- current data model, required for migration.
- what is the current printing solution? can it be re-used?