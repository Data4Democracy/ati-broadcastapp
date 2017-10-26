// Controller for handling posts

import mongoose from 'mongoose';

import { makeError, middlewareFactory } from '../_common/express-helpers';
import fbRequest from './_common/fbRequest';

//  models can only be defined after the schema have been defined. There
//  might be a better way to handle this.
let Broadcast = null;
let Debuglog = null;
// initialize the models, but only once
function initModels() {
  if (!Broadcast) {
    Broadcast = mongoose.model('Broadcast');
  }
  if (!Debuglog) {
    Debuglog = mongoose.model('Debuglog');
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
  if (!user.states.includes(body.state)) {
    return false;
  }

  return true;
}

//  eventually, this will get the groups for each state
async function getGroups(state) { // eslint-disable-line no-unused-vars
  return ['1025537044214027', '1318937518226597'];
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

export async function newPostMain({ body }, { locals: { user } }) {
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

  const [broadcast, groups] = await Promise.all([
    Broadcast.newBroadcast(user, state, message),
    getGroups(state)]);

  const broadcastOperation = broadcast.broadcastOperations[0];
  const messageState = broadcast.messageStates[0];

  const fbReqResponse = await fbRequest({
    reqs: groups.map(group => ({
      method: 'POST',
      relative_url: `${group}/feed`,
      // eslint-disable-next-line prefer-template
      body: 'message=' + encodeURIComponent(message),
    })),
    metadata: {
      user,
      type: 'post-new',
      address: {
        broadcastId: broadcast._id,
        broadcastOperationId: broadcastOperation._id,
      },
    },
    contexts: groups,
  });

  //  first, set up the promise for updating debug
  broadcastOperation.debug = fbReqResponse.map(batch => batch.debug);
  //  note that there's no reason to wait for this finish
  broadcast.save();

  //  next, we set up promises for waiting for each response and then
  //     2.1) update broadcast with updated group status
  //     2.2) update client

  //  successPostIds: a hash connecting each group with the post_id
  //  failsByCode: a hash connecting each fail code with a list of
  //    affected groups
  const [successPostIds, failsByCode] = [{}, {}];

  //  note that the FB response is of the form:
  //  [ { code: 200, body: {id: '1025537044214027_1079783908789340'},
  //      headers: ... },
  //    { code: 200, body: {id: '1318937518226597_1382691538517861',
  //      headers: ... } },
  //    { code: 400, body: {error: {
  //        message: ..., code: ..., fbtrace_id: ... }}, headers: ... } ]
  await Promise.all(fbReqResponse.map(async (fbReqBatch) => {
    const response = await fbReqBatch.response;
    response.forEach((oneResponse, idx) => {
      const groupId = fbReqBatch.contexts[idx];
      if (oneResponse.code === 200) {
        successPostIds[groupId] = oneResponse.body.id;
      } else {
        const failCode = failCodeForResponse(oneResponse);
        if (!failsByCode[failCode]) {
          failsByCode[failCode] = [];
        }
        failsByCode[failCode].push(groupId);
      }

      //  update the message status of successful posts
      for (const [successGroup, postId] of Object.entries(successPostIds)) {
        broadcast.groupStatus[successGroup] = { messageState, postId };
      }
    });
  }));
  broadcast.editedState = null;
  // note that there's no reason to wait for this to finish
  broadcast.save();

  // all responses have been processed at this point
  const overallResponse = {
    broadcastId: broadcast._id,
    broadcastOperationId: broadcastOperation._id,
    successGroups: Object.keys(successPostIds),
  };
  if (Object.keys(failsByCode).length !== 0) {
    overallResponse.error = {
      errors: [],
    };
    for (const [code, failedGroups] of Object.entries(failsByCode)) {
      overallResponse.error.errors.push({
        code: parseInt(code, 10),
        failedGroups,
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
