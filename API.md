# Backend API

Some notes:

+ All API URL's are prefixed with /api.

+ User must be logged in via session cookie for endpoints except for /login-status.

## /login

### /login GET

Get login state.

Response: `{ "data": { ... } }`

name of subfield of `response.data` | type  |  description
--- | --- | ---
isLoggedIn | Boolean | Is user logged in?
firstName | String | * user's first name
lastName | String | * user's last name
states | {String: Mixed} | * A hash. Each key is a state that the user is permitted to post to. Each value is itself a hash giving attributes about the state. It is of the form `{fbProfsJoined, fbProfsKnownNotJoined}`, where `fbProfsJoined` is the number of fbProfs that the priveleged user can post to and `fbProfsKnownNotJoined` is the number of fbProfs that are known but that haven't joined. 
isAdmin | Boolean | * Is the user an admin?

*: Only present if user is logged in.

### /login POST

Login via an ID token

#### POST body

field name | type  |  description
--- | --- | ---
idToken | String | the id token

#### response

Same as /login GET

### /login DELETE

Destroy any existing login

#### response

*On success*:

http status code will be 200.

## /admin

### /admin/update-access-token POST

Update an access token

#### POST body

field name | type  |  description
--- | --- | ---
userIdOt | String | the facebook user ID of the user
accessToken | String | the access token returned by Facebook FB.login()

#### response, on success

field name | type  |  description
--- | --- | ---
expiryDate | Date | date of token expiration

## /post

### /post POST

Create a new post

#### POST body

field name | type  |  description
--- | --- | ---
state | String | the state to post in
message | String | the message to be posted

#### response

field name | type  |  description
--- | --- | ---
broadcastId | Number (integer) | the id in the [Broadcasts document](#broadcasts)
broadcastOperationId | Number (integer) | the [BroadcastOperation](#broadcastoperations) id
successFbProfs | [FbProfs] | an array of the facebook profiles that were successfully updated
error | Object | error object. See below. *only present on an error.*

`response.error`:

field name | type  |  description
--- | --- | ---
code | Number (integer) | the http code for the response
errors | [Object] | each object in the array specifies a type of error. See below.

`response.error.errors[N]`:

field name | type  |  description
--- | --- | ---
reason | String | code name indicating error
message | String | human readable error message
fbProfs | [FbProfs] | an array of affected [fbProfs](#fbProfs)
completionTime | Date | estimated completion time. *only if server will retry message.*

##### fbProfs

an fbProf is an object of the form { id, idOt, name }, where the entries have the same meaning as in [DATABASE.md](DATABASE.md).

## Error reasons

This is a list of error reasons that might be encountered

reason |  description
--- | ---
InvalidCredentials | request does not have appropriate credentials
CouldNotVerifyToken | user's token could not be authenticated
NoUser | user's login id was not in user database
ServerError | generic server error reason.
