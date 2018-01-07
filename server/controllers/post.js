// Controller for handling posts

import mongoose from 'mongoose';

import { makeError, middlewareFactory } from '../_common/express-helpers';
import { fbRequestsFull } from './_common/fbRequestFcns';

//  models can only be defined after the schema have been defined. There
//  might be a better way to handle this.
let Broadcast;
let Debuglog;
let FbProf;
// initialize the models, but only once
function initModels() {
  if (!Broadcast) {
    Broadcast = mongoose.model('Broadcast');
  }
  if (!Debuglog) {
    Debuglog = mongoose.model('Debuglog');
  }
  if (!FbProf) {
    FbProf = mongoose.model('FbProf');
  }
}

//  make the request format is OK
function newPostValidateRequestFormat(body) {
  if (typeof body.message === 'string'
      && typeof body.state === 'string') {
    return true;
  } else {
    return false;
  }
}

//  user validation
//  is user allowed to make request
function validateUser(body, user) {
  if (!user.get('states').includes(body.state)) {
    return false;
  }

  return true;
}

//  eventually, this will get the profiles for each state
async function getFbProfs(state) { // eslint-disable-line no-unused-vars
  initModels();
  return FbProf.debugFbProfs;
  // return ['1025537044214027', // '1318937518226597', // , '461816757311012'
  // ];
  // return ['abc123lbj'];
}

//  give a fail code for a particular response. For now, we just use the
//  FaceBook codes but in the future, we might want something different
//  if no error found, return 1
function failCodeForResponse(response) {
  return (
    response && response.body
      && response.body.error && response.body.error.code)
    ? response.body.error.code
    : 1;
}

export async function newPostMain({ ip, body }, { locals: { user } }) {
  initModels();

  // validate format
  if (!newPostValidateRequestFormat(body)) {
    return makeError({
      message: 'Bad request format',
      reason: 'BadRequest',
    }, 400);
  }

  // validate permissions
  if (!validateUser(body, user)) {
    return makeError({
      message: (
        'User does not have the credentials for the requested operation.'),
      reason: 'InsufficientCredentials',
    }, 403);
  }

  const { state, message } = body;

  const [broadcast, fbProfs]
    = await Promise.all([
      Broadcast.newBroadcast(user, state, message),
      getFbProfs(state)]);

  const broadcastOperation = broadcast.get('broadcastOperations')[0];
  const messageStateId = broadcastOperation.get('messageStateId');

  const fbReqResponse = await fbRequestsFull({
    reqs: fbProfs.map(fbProf => ({
      method: 'POST',
      relative_url: `${fbProf.idOt}/feed`,
      body: 'message=' + encodeURIComponent(message),
    })),
    metadata: {
      user,
      ip,
      type: 'post-new',
      address: {
        broadcastId: broadcast.get('_id'),
        broadcastOperationId: broadcastOperation.get('_id'),
      },
    },
  });

  //  save debuglogs
  broadcastOperation.set('debuglogIds', fbReqResponse.debuglogs);
  //  note that there's no reason to wait for this finish
  await broadcast.save();

  //  next, we deal with each reponse, doing:
  //     2.1) update broadcast with updated profile status
  //     2.2) update client

  //  successes: an array where each element is a pair
  //    [fbProf, postIdOt], i.e. which connects each fbProf with the
  //    Facebook post_id (i.e. postIdOt)
  const successes = [];
  //  failsByCode: a hash connecting each fail code with a list of
  //    affected fbProfs
  const failsByCode = {};

  //  note that the FB response is of the form:
  //  [ { code: 200, body: {id: '1025537044214027_1079783908789340'},
  //      headers: ... },
  //    { code: 200, body: {id: '1318937518226597_1382691538517861',
  //      headers: ... } },
  //    { code: 400, body: {error: {
  //        message: ..., code: ..., fbtrace_id: ... }}, headers: ... } ]
  fbReqResponse.responses.forEach((oneResponse, idx) => {
    const fbProf = fbProfs[idx];
    if (oneResponse.code === 200) {
      successes.push([fbProf, oneResponse.body.id]);
    } else {
      const failCode = failCodeForResponse(oneResponse);
      if (!failsByCode[failCode]) {
        failsByCode[failCode] = [];
      }
      failsByCode[failCode].push(fbProf);
    }
  });

  // update broadcast
  const broadcastFbProfStatuses = {};
  //  update the message status of successful posts
  for (const [fbProf, postIdOt] of successes) {
    broadcastFbProfStatuses[fbProf.id] = [messageStateId, postIdOt];
  }
  broadcast.set('fbProfStatuses', broadcastFbProfStatuses);
  broadcast.set('editedState', null);

  await broadcast.save();

  //  now we make response
  const overallResponse = {
    broadcastId: broadcast.id,
    broadcastOperationId: broadcastOperation.id,
    successFbProfs: successes.map(pair => pair[0].forResponse()),
  };
  if (Object.keys(failsByCode).length !== 0) {
    overallResponse.error = {
      errors: [],
    };
    for (const [code, failedFbProfs] of Object.entries(failsByCode)) {
      overallResponse.error.errors.push({
        code: parseInt(code, 10),
        fbProfs: failedFbProfs.map(fbProf => fbProf.forResponse()),
      });
    }
    const firstError = overallResponse.error.errors[0];
    overallResponse.error.code = 400;
    ['message', 'reason'].forEach((el) => {
      if (firstError[el]) {
        overallResponse.error[el] = firstError[el];
      }
    });
  }

  return overallResponse;
}

export default {
  newPost: middlewareFactory(newPostMain),
};
