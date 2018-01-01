# Database collections

## Adminsettings

The Adminsettings collection hold settings for the Admin user. Each document must have a `name`, holding the setting's name, and then the other fields differ per setting and indicate the setting's values.

### accessToken

The Facebook access token for the broadcast user.

field name | type | description
---- | ---- | ---
token | String | The access token
expiryDate | Date | the token's expiration date

### groupsRawHash

The hashed version of the groups list as downloaded.

field name | type | description
---- | ---- | ---
groupsRawHash | String | the sha1, latin1-encoded hash of the last downloaded groups list

## Broadcasts

Each document is a broadcasted message. The format for a document:

field name | type | description
---- | ---- | ---
state | String | **[indexed]** state for which the broadcast is made
messageStates | [[MessageState](#messagestates)] | the history of the message's edits over its lifetime
profileStatuses | {String fbProfIdStr: [ObjectId messageStateId, String fbPostIdOt]} | an object indicating each profile's last confirmed state. Each key is a the id of an `fbProf` and each value is an array `[messageStateId, fbPostIdOt]`, where `messageStateId` is from the messageState and `fbPostIdOt` is the facebook ID of the post and is `null` if the post has been deleted
broadcastOperations | [[BroadcastOperation](#broadcastoperations)] | in-depth history of the broadcast's updates, for debugging
editedState | Date | date that edit started if broadcast is being edited, null otherwise

### MessageState's

An object for specifying the state of the message at one time

field name | type | description
---- | ---- | ---
message | String | either the message, or null if message deleted

### BroadcastOperation's

An object corresponding to one broadcast operation, e.g. broadcasting or deleting a message. It is mostly useful for debugging.

field name | type | description
---- | ---- | ---
date | Date | date of request
userId | Objectid | user making request
messageStateId | Number (integer) | id of the message state that the operation is aiming toward
retryFl | Boolean  | true if attempt is a retry of an incomplete posting
debuglogIds | [ObjectId] | array of [Debuglog](#debuglog) IDs associated with the operation
response | Mixed | response object returned to requestor

## Users

The Users collection holds all allowed users.

field name | type | description
---- | ---- | ---
firstName | String | first name
lastName | String | last name
states | [String] | an array of the states the user is allowed access to
authUserIdOt | String | **[indexed]**. An identifier used by the authentication server for identifying users. E.g., for Google, it is 'sub', a identifier uniquely associated with each user *(note that Google recommends against using the email for this purpose because e-mails can change)*
loginEmail | String | **[indexed]** Email address used for login purposes.
contactEmail | String | **[indexed]** user e-mail for contacting
isAdmin | Boolean | is the user an admin?

Note that `authUserIdOt` should ultimately be the principal means of identifying users but that, initially, only `loginEmail` might be known.

## Debuglogs

Holds all interactions with Facebook for debugging.

field name | type | description
---- | ---- | ---
date | Date | date of interaction
userId | ObjectId \| 'cron' \| 'cron-dev' | user making request. if from cron job, will be 'cron' -- if from AppEngine -- or 'cronDev' -- if run in dev mode
ip | String | ip address of requesting user
request | Mixed | the request object
response | Mixed | the response object
type | String | the type of interaction, e.g. `'post.new'`, to post a new message. Use dot-separated camelcase for the names (e.g. `postThis.new` could be a valid type).
address | Mixed | an object that provides an "address" for the request. E.g., if for a message posting, the object will be of the form `{BroadcastId: ..., BroadcastOperationId: ...}`

## Groups

Contains information about an Indivisible group.

[Note: Information in this collection should not be considered to be long-lived. It may be fully or partially regenerated every time the groups are updated.]

Note that there could be many groups tied to one FbProf (if, for example, the source listed a group multiple times).

field name | type | description
---- | ---- | ---
name | String | \*[*title*] name of the group
state | String | 2-letter abbreviation of the state
fbProfId | ObjectId | link to FbProf, if appropriate
fbProfFailReason | { reason, ref} | if looking up the fbProf failed, this will give more information. [[The format is explained below](#fbprofilefailreason)]
fbUrl | String | \*[*facebook*]
lat | String | *
lng | String | *
twitter | String | *
phone | String | *
email | String | *
venue | String | *
urlOt | String | \*[*url*] project 

* read straight from input json (from indicated field, if not clear)

### fbProfFailReason

The `fbProfFailReason` field will be an object `{ reason, ref}`. These are the possible values for the reason field:

reason | explanation | value for ref
---- | ---- | ---
FbProfDuplicate | the fbProf is a duplicate of one from another group | ID of group with the fbProf
BadFbUrl | the fbUrl is bad | ID of badFbUrl
FacebookQueryFailed | the facebook query failed | {REASON, MORE}, where REASON is a string and MORE will depend on the REASON but will generally be the Facebook response or possibly an error object

## FbProfs

This holds information about Facebook profiles. (In Facebook parlance, a "profile" can be a page or a group.)

field name | type | description
---- | ---- | ---
idOt | String | the Facebook id of the profile
name | String | the name (or co-name, if not isCertain) of the profile
isCertain | Boolean | See above
type | String | type of profile, i.e. 'group' or 'page'
fbUrls | [String] | Facebook urls (e.g., from the groups JSON that are downloaded) that are affiliated with this profile

## BadFbUrls

Each document is a known bad fburl, i.e. a facebook URL that doesn't resolve to an ID. fburls here are not checked in FbProfs

field name | type | description
---- | ---- | ---
fbUrl | String | the offending fburl
reason | String | the reason for the rejection. One of 'BadFacebookResponse', 'UrlParseFailed'.
response | Object | the full response from Facebook for the fbUrl, if relevant

## CachedLocations

Holds cached versions of locations that we have located, so we don't have to query for locations we have already found

field name | type | description
---- | ---- | ---
lat | String | raw lat string from downloaded JSON
lng | String | raw lat string from downloaded JSON
state | String | state of pair
source | String | either 'arcgis' or 'manual'. Where the data came from.
