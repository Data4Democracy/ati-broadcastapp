// code for making a facebook request and logging it to the debuglogs
// collection

import mongoose from 'mongoose';
import request from 'request-promise-native';

// this is a FaceBook set constant of the maximum number of requests per
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

//  post an array of Facebook requests.
//
//  *Input object*
//    { req, metadata, contexts, parseResponse }
//  REQS: an array. Each item in REQS is an object sent in a facebook
//    batch request.  Usually, it will be of the form
//    { method, relative_url, body }
//  METADATA: metadata for the debuglogs document.
//    It should be an object { user, type, address }, whose meanings are
//    described in TECHNICAL.md
//  CONTEXTSIN: an optional array of contexts for each item in REQS. When the
//    response is returned, an additional 'contexts' array will be returned,
//    containing the context item corresponding to each requested item. If
//    given, it must be the same lenth as REQS.
//  PARSERESPONSE: if truthy or undefined, each batched response undergoes
//    some parsing. in particular, for each individual response:
//     1) RESPONSE.code is parsed as an int
//     2) RESPONSE.body is parsed as JSON
//     3) if response is an error, RESPONSE.error.code is parsed as an int
//    otherwise, we do not parse the body of each response
//
//  *Output*
//  The resolved value will be an array of objects for each batched
//  Facebook request.
//     { debuglog, response, reqs, contexts }.
//  DEBUGLOG: an object in the Debuglogs collection.
//  RESPONSE: a promise for Facebook's response
//  REQS: the request included in that batch
//  CONTEXTS: the items in CONTEXTSIN corresponding to the items in REQS.
//    null if CONTEXTS was not given in the input
export default async function fbRequest(
  { reqs, metadata, contexts = null, parseResponse }) {
  initModels();

  // if parseResponse is undefined, make it true
  // eslint-disable-next-line no-param-reassign
  if (parseResponse === undefined) parseResponse = true;

  // if contexts is non-null, check that it is the same length as reqs
  if (contexts && (reqs.length !== contexts.length)) {
    throw new Error('CONTEXTSIN must be same length as REQS');
  }

  // check that metadata has needed elements
  if (!(metadata && metadata.user && metadata.type && metadata.address)) {
    throw new Error('fbRequest metadata lacking all needed options');
  }

  //  get access token
  const token = await getToken();

  //  split requests into batches
  //  each batch will be an object as described in OUTPUT above.

  //  note that we need to use .fill(0) or batches.map won't work
  let batches
      = Array(Math.ceil(reqs.length / maxReqsPerBatch)).fill(0);
  batches = Promise.all(
    batches.map(async (_, idx) => {
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
      const debuglog = new Debuglog({
        date: new Date(),
        user: metadata.user,
        request: fbReq,
        type: metadata.type,
        address: metadata.address,
      });
      await debuglog.save();

      const outputResponsePromise = new Promise(async (resolve, reject) => {
        // we make a shortcut for response
        let fbResponse;
        try {
          // eslint-disable-next-line no-multi-assign
          fbResponse = debuglog.response = JSON.parse(await request(fbReq));
        } catch (e) {
          debuglog.error = mongoifyError(e);
        }
        await debuglog.save();

        if (fbResponse) {
          //  note that we don't expect to save debuglog again so we
          //  go ahead and edit fbResponse

          if (parseResponse) {
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
