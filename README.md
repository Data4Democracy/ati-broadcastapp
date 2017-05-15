# ati-broadcastapp

**Slack:** [#atibroadcastapp](https://datafordemocracy.slack.com/messages/C4VTQ2G4U/)

**Project description:** The ATI Broadcast app group is building a Facebook publishing app for the group America the Indivisible. Via this app an AITD trusted partner will be able to broadcast a message to multiply Facebook groups from one interface. This will allow the local groups in a region, of which there are many, to better communicate and mobilize toward specific actions.

**High level requirements**:
+ There is one trusted advisor per state. There are multiple FB AID groups per state so this tool will be "one to many" solution in terms of interaction with FB
+ The tool will be secured; current thinking is to use Google's security as the site is running on Google and the trusted advisors would be able to access via their Gmail accounts
+ The messages will be text only (at least for this version). The feature should provide ability to edit/delete as well although that may depend on what the FB API provides. 
+ Initial states to roll out are Ohio, Georgia and Oklahoma but will need to be built with the scale to every state in mind

**Project Leads:**
+ [@alecf](https://datafordemocracy.slack.com/messages/@alecf/)

**Project Maintainers:** Maintainers have write access to the repository. They are responsible for reviewing pull requests, providing feedback and ensuring consistency.
+ [@wtee](https://datafordemocracy.slack.com/messages/@wtee)
+ [@andrew_chou](https://datafordemocracy.slack.com/messages/@andrew_chou)
+ [@jonganc](https://datafordemocracy.slack.com/messages/@jonganc)
+ [@lilianhj](https://datafordemocracy.slack.com/messages/@lilianhj)

## Getting Started:
### Things you should know

+ "First-timers" are welcome! Whether you're trying to learn data science, hone your coding skills, or get started collaborating over the web, we're happy to help. (Sidenote: with respect to Git and GitHub specifically, our github-playground repo and the #github-help Slack channel are good places to start.)
+ We believe good code is reviewed code. All commits to this repository are approved by project maintainers and/or leads (listed above). The goal here is not to criticize or judge your abilities! Rather, sharing insights and achievements. Code reviews help us continually refine the project's scope and direction, as well as encourage the discussion we need for it to thrive.
+ This README belongs to everyone. If we've missed some crucial information or left anything unclear, edit this document and submit a pull request. We welcome the feedback! Up-to-date documentation is critical to what we do, and changes like this are a great way to make your first contribution to the project.
+ Project will be conducted in an agile format with sprints of approximately two weeks
+ Read [the technical specs](TECHNICAL.md) for a description of the organization of this app.

## Project Areas
### Hosting/Infrastructure
The application will (likely) be hosted on the Google platform. This area encompasses decision on right Google platform/configuration, responsibility for deployment of code to the environment for testing and eventually production release

### Authorization/Authentication
The goal is to use Google's security so that the current AITD members can leverage their Google accounts to access.

### Application
The application will be built using Express (web dev framework for Node.js - more info at expressjs.com). DB will likely be a Mongo instance. 

The application will encompass several main functional areas or layers:
+ **FB Graph API integration** - To allow the application to access FB groups directly for publishing, editing and deleting. Assumes that the application has the proper access tokens/rights for that FB group
+ **AITD site scraper** - In order for the AITD staff to contact the individual group admins to get permission they will need a list of the FB groups within their area. This tool should allow an authorized use to query the AITD group list for their state and receive a list of the group names and FB group information. Need to define reqs for list but a .csv for download should suffice here.  
+ **Publishing tool and interface** - The bulk of the application. This will provide a user the ability to select a state to publish to from a list; create a text based post and publish. Application should also provide list of past posts (need to define reqs here) to allow users edit and/or delete (dependent on the FB Graph API functionality). This area contains interface development (including error conditions) as well data storage required. We'll probably break this down further as it develops. 
