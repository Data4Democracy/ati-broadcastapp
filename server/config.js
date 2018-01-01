//  Get config settings.
//  Returns a promise for a nconf object.

import path from 'path';
import nconf from 'nconf';
import request from 'request-promise-native';

import asyncConstant from './_common/asyncConstant';
import { parseStatesAllowed } from './_common/misc';

//  get metadata at the given relative url
export async function gaeGetMetadata(relUrl) {
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
    'google_oauthsecret',
    'google_apikey',
    'arcgis_clientid',
    'arcgis_clientsecret',
    'states_allowed',
  ];

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

  try {
    //  project-id should always be defined.
    //  thus, if request doesn't throw an error, we are on Google App
    //  Engine
    await gaeGetMetadata('project-id');
    nconf.set('is_gae', true);
  } catch (e) {
    nconf.set('is_gae', false);
  }

  //  if we are on Google App Engine, retrieve values from metadata
  if (nconf.get('is_gae')) {
    await Promise.all(fromGaeMetadata.map(async (el) => {
      if (!nconf.get(el)) {
        nconf.set(el, await gaeGetMetadata(`attributes/${el}`));
      }
    }));
  }

  nconf.required(required);

  // process states_allowed
  nconf.set(
    'states_allowed', parseStatesAllowed(nconf.get('states_allowed')));

  console.log('states_allowed:', nconf.get('states_allowed'));

  return nconf;
}

/**
 * a promise for the configuration
 */
export default asyncConstant(getNconf);
