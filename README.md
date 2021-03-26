# FusionAuth Modern Guide to OAuth example application

This project is a simple application that we build as part of our [Modern Guide to OAuth eBook](https://fusionauth.io/learn/expert-advice/oauth/modern-guide-to-oauth/). 


## Prerequisites

* Node - tested with node 14
* FusionAuth - [get going in 5 minutes](https://fusionauth.io/docs/v1/tech/5-minute-setup-guide/)

## To install this application

* `npm install`
* create application
* get client id and secret
* update issuer to be fusionauth url (because of oidc) in the tenant settings
* create rsa key
* enable jwt in app
* change signing algos to be rsa key

