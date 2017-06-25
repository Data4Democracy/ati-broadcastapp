//  Get config settings.
//  Returns a promise for a nconf object.

import path from 'path';
import nconf from 'nconf';
import request from 'request-promise-native';

//  get metadata at the given relative url
async function gaeGetMetadata(relUrl) {
  //  note that await is not required here
  return request({
    url:
    `http://metadata.google.internal/computeMetadata/v1/project/${relUrl}`,
    headers: { 'Metadata-Flavor': 'Google' },
    simple: true,
  });
}

//  The main function for making the config object.
//  Returns an nconf object.
async function getNconf() {
  //  settings obtained from GAE metadata
  const fromGaeMetadata = [
    'cookiesecret',
    'fb_appsecretid',
    'fb_broadcastuserid',
    'mongo_connectionstring'];

  //  settings required
  const required = fromGaeMetadata.slice().concat(['port']);

  nconf
    .argv()
    .env(required)
    .file({ file: path.join(
      __dirname, '..', 'server', 'credentials-secret.json') })
    .use('memory')
    .defaults({
      port: 8080,
    });

  //  note that, weirdly, nconf.set(...) affects the .use('memory')
  //  location, so that using nconf.set overrides the default

  //  are we on Google App Engine?

  let onGaeFl;
  //  project-id should always be defined
  try {
    //  if request doesn't throw an error, we are in Google App Engine
    await gaeGetMetadata('project-id');
    onGaeFl = true;
  } catch (e) {
    onGaeFl = false;
  }

  //  if we are on Google App Engine, retrieve values from metadata
  if (onGaeFl) {
    await Promise.all(fromGaeMetadata.map(async (el) => {
      if (!nconf.get(el)) {
        nconf.set(el, await gaeGetMetadata(`attributes/${el}`));
      }
    }));
  }

  nconf.required(required);
  return nconf;
}

//  resolvedTo, rejectedTo is the value, err to which getNconf
//  resolves, rejects, respectively
let resolvedTo;
let rejectedTo;

//  The promises that need to be resolved with resolvedTo.
//  Each promise is actually an array [resolve, reject].
const promisesToResolve = [];

//  Wraps getNconf to deal with promisifying the output.
(async function getNconfWrapper() {
  try {
    resolvedTo = await getNconf();
    // eslint-disable-next-line no-unused-vars
    for (const [resolve, _reject] of promisesToResolve) {
      resolve(resolvedTo);
    }
  } catch (err) {
    rejectedTo = err;
    // eslint-disable-next-line no-unused-vars
    for (const [_resolve, reject] of promisesToResolve) {
      reject(rejectedTo);
    }
  }
}());

//  Get a promise that always resolve to the value of nconf
export default function getPromise() {
  if (rejectedTo !== undefined) { return Promise.reject(rejectedTo); }
  if (resolvedTo !== undefined) { return Promise.resolve(resolvedTo); }

  return new Promise((resolve, reject) => {
    promisesToResolve.push([resolve, reject]);
  });
}
