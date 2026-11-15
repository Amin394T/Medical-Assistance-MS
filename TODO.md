## REMINDER
- init-cap list values
- reporting date not read only and required
- link medical records to its invoices
- replace USER with logged-in user
- automatically revalidate records at delta file upload
- user authentication
- server-side pagination for long lists
- server-side input validation
- document printing from tables
- make error messages appear as popup notification
- 

- insurance policy employees's employee column should have the name, not the national ID, it comes uppercased in the delta file, so name matching should ignore case, also fix the mock data ;
- updating record's services and certificates should update the record's last updated and last updater ;


## NEEDS
- go through reports
- current data model, required for migration
- remaining columns in certificates
- invoice per record or can have multiple?
- is tax the same for all?


## IMPROVEMENTS
- connect phone system to application :
    + launch calls from client or service provider ;
    + save phone log in database ;
    + record calls option ;
    + infer caller during record creation ;
- e-mailing documents from the application :
    + outgoing e-mails to selected clients ;
    + incoming from insurance companies ;
- AI assistant ;
- geo-location matching between service providers and accident place ;
- data archiving ;
- user actions audit ;
- medical coverages displayed like medical certificates ;
