## REMINDER
- disallow deletion for insurance providers
    + no policy change
- disable editing for read-only fields
    + reporting date not read only and required
- record services or certificates modifications should update lastUpdated and lastUpdater
- replace USER with logged-in user
- automatically revalidate records at delta file upload
- user authentication
- server-side pagination for long lists
- server-side input validation
- document printing from tables
- make error messages appear as popup notification


## NEEDS
- can we validate records automatically at delta file upload
- delta file(s) fields, list of beneficiaries
- are brokers and agents just informational?
- go through reports
- why does policy verification require a record?
- remaining columns in certificates
- invoice per record or can have multiple?
- is tax the same for all?
- current data model, required for migration


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