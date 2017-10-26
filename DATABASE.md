# Database collections

## Admin (settings)

The Admin collection hold settings for the Admin user. Each document must have a `name`, holding the setting's name, and then the other fields differ per setting and indicate the setting's values.

### accessToken

The Facebook access token for the broadcast user.

field name | type | description
---- | ---- | ---
token | String | The access token
expiryDate | Date | the token's expiration date

## Broadcasts

Each document is a broadcasted message. The format for a document:

field name | type | description
---- | ---- | ---
state | String | **[indexed]** state for which the broadcast is made
messageStates | [[MessageState](#messagestates)] | the history of the message's edits over its lifetime
groupStatus | {String: Mixed} | an object indicating each groups last confirmed state. Each key is the group id and each value is an array [MESSAGE\_ID, POST\_ID], where MESSAGE\_ID is from the messageState and POST_ID is `null` if the post has been deleted
broadcastOperations | [[BroadcastOperation](#broadcastoperations)] | in-depth history of the broadcast's updates, for debugging
editedState | Date | date that edit started if broadcast is being edited, null otherwise

### MessageState's

An object for specifying the state of the message at one time

field name | type | description
---- | ---- | ---
id | Number (integer) | 0-based number for an index
message | String | either the message, or null if message deleted

### BroadcastOperation's

An object corresponding to one broadcast operation, e.g. broadcasting or deleting a message. It is mostly useful for debugging.

field name | type | description
---- | ---- | ---
id | Number (integer) | 0-based number for an index
date | Date | date of request
userId | Objectid | user making request
messageStateId | Number (integer) | id of the message state that the operation is aiming toward
retryFl | Boolean  | true if attempt is a retry of an incomplete posting
debuggingIds | [ObjectId] | array of [Debugging](#debugging) IDs associated with the operation
response | Mixed | response object returned to requestor

## Users

The user collection holds all allowed users.

field name | type | description
---- | ---- | ---
firstName | String | first name
lastName | String | last name
states | [String] | an array of the states the user is allowed access to
userIdAuth | String | **[indexed]**. An identifier used by the authentication server for identifying users. E.g., for Google, it is 'sub', a identifier uniquely associated with each user *(note that Google recommends against using the email for this purpose because e-mails can change)*
loginEmail | String | **[indexed]** Email address used for login purposes.
contactEmail | String | **[indexed]** user e-mail for contacting
isAdmin | Boolean | is the user an admin?

Note that `userIdAuth` should ultimately be the principal means of identifying users but that, initially, only `loginEmail` might be known.

## Debuglog

Holds all interactions with Facebook for debugging.

field name | type | description
---- | ---- | ---
date | Date | date of interaction
userId | ObjectId | user making request
request | Mixed | the request object
response | Mixed | the response object
type | String | the type of interaction, e.g. `'updateAccessToken'`, `'postMessage'`. Will generally be the same as the controller function name
context | Mixed | an object that provides an "address" for the request. E.g., if for a message posting, the object will be of the form `{BroadcastId: ..., BroadcastOperationId: ...}`
