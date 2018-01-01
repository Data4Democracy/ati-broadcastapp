// code for making facebook requests and logging them to the debuglogs
// collection
//
// fbRequests and fbRequest are the simplest and most user-friendly
// versions

import lodash from 'lodash';
import mongoose from 'mongoose';
import request from 'request-promise-native';

// this is a FaceBook-set constant of the maximum number of requests per
// batch request. It is 50 in principle. However, we keep it as a constant
// to be lowered for debugging purposes.
const maxReqsPerBatch = 50;

let Adminsetting = null;
let Debuglog = null;

function initModels() {
  if (!Adminsetting) {
    Adminsetting = mongoose.model('Adminsetting');
  }
  if (!Debuglog) {
    Debuglog = mongoose.model('Debuglog');
  }
}

//  make an error object into a mongo compatible format
function mongoifyError(err) {
  const mErr = {};
  for (const prop of Object.getOwnPropertyNames(err)) {
    mErr.prop = JSON.parse(JSON.stringify(err[prop]));
  }
  return mErr;
}

// get the adminsettings token
async function getToken() {
  const tokenOpt = await Adminsetting.findOne({ name: 'accessToken' });
  if (!(tokenOpt && tokenOpt.get('token'))) {
    throw new Error('No access token found');
  }
  return tokenOpt.get('token');
}

const metadataKeysRequired = ['user', 'ip', 'type'];
const metadataKeysAllowed = [...metadataKeysRequired, 'address'];

//  Post an array of Facebook requests.
//  Return a result where the response for each batch is a separate
//    promise.
//  This is the workhorse of the fbRequest functions
//
//  Input:
//    An object { reqs, metadata, contexts, willParseResponse }
//  REQS, METADATA, WILLPARSERESPONSE are as in fbRequests.
//  CONTEXTS: an optional array of contexts for each item in REQS. When the
//    response is returned, an additional 'contexts' array will be returned,
//    containing the context item corresponding to each requested item. If
//    given, it must be the same lenth as REQS.
//
//  Output:
//  An array of objects, one for each batch of Facebook requests:
//     { debuglog, response, reqs, contexts }.
//  Note that the order of the batches and the order of the responses in
//    each batch will match the order of the REQS passed in.
//  DEBUGLOG: an object in the Debuglogs collection
//  RESPONSE: a promise for Facebook's response
//  REQS: the request included in that batch
//  CONTEXTS: the items in CONTEXTSIN corresponding to the items in REQS.
//    null if CONTEXTS was not given in the input
export async function fbRequestsByBatchFull(
  { reqs, metadata, contexts = null, willParseResponse }) {
  initModels();

  // verify that reqs is an array
  if (!(typeof reqs.length === 'number')) {
    throw new Error(`reqs must be an array: ${reqs.toString()}`);
  }

  // if willParseResponse is undefined, make it true
  // eslint-disable-next-line no-param-reassign
  if (willParseResponse === undefined) willParseResponse = true;

  // if contexts is non-null, check that it is the same length as reqs
  if (contexts && (reqs.length !== contexts.length)) {
    throw new Error('CONTEXTSIN must be same length as REQS');
  }

  // check that metadata has needed elements and no others
  if (!metadata) {
    throw new Error('metadata is not an object: ' + metadata);
  } else {
    const metadataKeysDiff
      = lodash.difference(metadataKeysRequired, Object.keys(metadata));
    if (metadataKeysDiff.length !== 0) {
      throw new Error(
        'fbRequest metadata lacking all needed options: ' + metadataKeysDiff);
    }
  }

  const metadataKeysExtra
    = lodash.difference(Object.keys(metadata), metadataKeysAllowed);
  if (metadataKeysExtra.length !== 0) {
    throw new Error(
      'Unknown metadata keys in fbRequest: ' + metadataKeysExtra);
  }

  //  get access token
  const token = await getToken();

  //  split requests into batches
  //  each batch will be an object as described in OUTPUT above.
  const batches = Promise.all(
    lodash.range(
      Math.ceil(reqs.length / maxReqsPerBatch))
      .map(async (idx) => {
        const reqsSliceFunc
              = theReqs => theReqs.slice(
                maxReqsPerBatch * idx, maxReqsPerBatch * (idx + 1));

        //  first get the array of requests
        let fbReq = reqsSliceFunc(reqs);

        //  get contexts
        let batchContexts;
        if (contexts) {
          batchContexts = reqsSliceFunc(contexts);
        }

        //  then, make the facebook request object
        fbReq = {
          url: 'https://graph.facebook.com/v2.10',
          method: 'POST',
          form: {
            access_token: token,
            batch: JSON.stringify(fbReq),
          },
        };
        //  note that we replace 'user' with 'userId' before inserting in
        //  debuglog
        /* eslint-disable no-shadow */
        const debuglog = await Debuglog.create({
          date: new Date(),
          request: fbReq,
          ...(
            lodash.mapKeys(
              metadata, (_, key) => (key === 'user' ? 'userId' : key))),
        });
        /* eslint-enable no-shadow */

        const outputResponsePromise = new Promise(async (resolve, reject) => {
          // we make a shortcut for response
          let fbResponse;
          try {
            fbResponse = JSON.parse(await request(fbReq));
            debuglog.set('response', fbResponse);
          } catch (e) {
            debuglog.set('error', mongoifyError(e));
          }
          await debuglog.save();

          if (fbResponse) {
            //  note that we don't expect to save debuglog again so we
            //  go ahead and edit fbResponse

            if (willParseResponse) {
              fbResponse.forEach((oneResponse) => {
                if (oneResponse.code) {
                  oneResponse.code = parseInt(oneResponse.code, 10);
                }
                oneResponse.body = JSON.parse(oneResponse.body);
                if (oneResponse.error && oneResponse.error.code) {
                  oneResponse.error.code
                    = parseInt(oneResponse.error.code, 10);
                }
              });
            }
            resolve(fbResponse);
          } else {
            reject(debuglog.error);
          }
        });

        const result = { debuglog, response: outputResponsePromise };

        if (batchContexts) {
          result.contexts = batchContexts;
        }
        return result;
      }));
  return batches;
}

//  Like fbRequests but includes more information in the output
//
//  Input:
//    Same as fbRequests
//
//  Output:
//    The resolved output is an object:
//       { debuglogs, responses }.
//    DEBUGLOGS: an array of Debuglogs
//    RESPONSES: the array of Facebook responses
export async function fbRequestsFull({ reqs, metadata, willParseResponse }) {
  const batchedResponse
        = await fbRequestsByBatchFull({ reqs, metadata, willParseResponse });

  return {
    debuglogs: batchedResponse.map(batch => batch.debuglog),
    responses: (
      await Promise.all(batchedResponse.map(batch => batch.response)))
      .reduce((accum, curVal) => accum.concat(curVal)),
  };
}

//  Post an array of Facebook requests and return the result
//  as an array of Facebook responses.
//
//  Input:
//    An object { reqs, metadata, willParseResponse }
//  REQS: an array. Each item in REQS is an object sent in a facebook
//    batch request.  Usually, it will be of the form
//    { method, relative_url, body }
//  METADATA: metadata for the Debuglogs document.
//    It should be an object { user, ip, type, address }, whose meanings are
//    described in DATABASE.md in Debuglogs, except that here, USER is a
//    mongoose object (rather than just the id)
//  WILLPARSERESPONSE: if truthy or undefined, each batched response undergoes
//    some parsing. in particular, for each individual response:
//     1) RESPONSE.code is parsed as an int
//     2) RESPONSE.body is parsed as JSON
//     3) if response is an error, RESPONSE.error.code is parsed as an int
//    Otherwise, we do not parse the body of each response
//
//   Output:
//     An array of facebook responses
export async function fbRequests(input) {
  const fbRequestsFullResponse = await fbRequestsFull(input);
  return fbRequestsFullResponse.responses;
}

//  Like fbRequest but includes more information in the output
//
//  Input:
//  Exactly as in fbRequest.
//
//  Output:
//  The resolved output is an object:
//     { debuglog, response }.
//  DEBUGLOG: The Debuglog
//  RESPONSE: the Facebook response
export async function fbRequestFull({ req, metadata, willParseResponse }) {
  if (req instanceof Array) {
    throw new Error('req should be either a string or object, not an array');
  }

  let theReq = req;
  if (typeof theReq === 'string') {
    theReq = {
      method: 'GET',
      relative_url: theReq,
    };
  }

  const response = await fbRequestsFull({
    reqs: [theReq], metadata, willParseResponse });

  return { debulog: response.debuglogs[0], response: response.responses[0] };
}

//  Make a single Facebook request and return the result
//
//  Input:
//    { req, metadata, willParseResponse }
//  Exactly as in fbRequests except req is either a single request object
//    or a string, in which case a get request is made.
//
//  Output: The Facebook response.
export async function fbRequest(input) {
  const fbRequestFullResponse = await fbRequestFull(input);
  return fbRequestFullResponse.response;
}
