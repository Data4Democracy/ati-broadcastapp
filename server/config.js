//  Get config settings.
//  Returns a promise for a nconf object.

import path from 'path';
import nconf from 'nconf';
import request from 'request-promise-native';

import asyncConstant from './_common/asyncConstant';

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
    'mongo_connectionstring',
    'google_clientsecret'];

  //  settings required
  const required = fromGaeMetadata.slice().concat(['port', 'is_gae']);

  nconf
    .argv()
    .env(required)
    .file({ file: path.join(
      __dirname, '..', 'server', 'config-server.json') })
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

  //  set is_gae
  nconf.set('is_gae', onGaeFl);


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

//  we use asyncConstant because we only want to resolve getNconf once, and
//  then to simply use that value
export default asyncConstant(getNconf);
