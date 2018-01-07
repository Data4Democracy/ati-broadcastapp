/**
 * find the state from the lat, lng
 */

import mongoose from 'mongoose';
import request from 'request-promise-native';

import getConfigPromise from '../../config';
import GroupFailure from './GroupFailure';
import { normalizeStateName } from '../../_common/states';

let CachedLocation;

let arcgisToken;
let arcgisExpiry;

function initModels() {
  if (!CachedLocation) CachedLocation = mongoose.model('CachedLocation');
}

async function setArcgisToken() {
  const date = new Date();
  if (arcgisExpiry && (date - arcgisExpiry) > 60000) return;
  const config = await getConfigPromise();
  // we don't try to catch errors when retrieving the ArcGIS token. If we
  // can't get the token, it's best just to fail the entire refresh

  // eslint-disable-next-line max-len
  //  from https://developers.arcgis.com/documentation/core-concepts/security-and-authentication/accessing-arcgis-online-services/
  const response = await request.post({
    url: 'https://www.arcgis.com/sharing/rest/oauth2/token/',
    json: true,
    form: {
      f: 'json',
      client_id: config.get('arcgis_clientid'),
      client_secret: config.get('arcgis_clientsecret'),
      grant_type: 'client_credentials',
      expiration: 20160,
    },
  });
  /* eslint-disable dot-notation */
  arcgisToken = response['access_token'];
  arcgisExpiry = new Date(date + (response['expires_in'] * 1000));
  /* eslint-enable dot-notation */
}

// this is for debugging only
function getArcgisTokenAndExpiry() {
  return [arcgisToken, arcgisExpiry];
}

//  get state by reverse geocoding from a longitude, latitude pair of
//    *numbers*
//
//  throws 'UnknownState', 'ArcgisFailed' if appropriate
async function getStateByRGeocoding(lngNum, latNum) {
  await setArcgisToken();
  let response;
  try {
    response = await request.post({
      url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode', // eslint-disable-line max-len
      json: true,
      form: {
        f: 'json',
        token: arcgisToken,
        location: JSON.stringify({ x: lngNum, y: latNum }),
      },
    });
  } catch (e) {
    throw new GroupFailure('ArcgisFailed', e);
  }

  if (response.error) throw new GroupFailure('ArcgisFailed', response);

  let state = response.address && response.address.Region;
  state = state && normalizeStateName(state);

  if (state) return state;
  else throw new GroupFailure('UnknownState', state);
}

//  find a state from the raw lng, lat from the groups-raw
export default async function getState(lngStr, latStr) {
  initModels();

  const cachedLocationKeys = { lng: lngStr, lat: latStr };

  // first, check cache
  let cachedLocation = await CachedLocation.findOne(cachedLocationKeys);
  if (cachedLocation) return cachedLocation.get('state');

  // if not found, lookup state and prepare cachedLocation to save
  cachedLocation = new CachedLocation(
    { ...cachedLocationKeys,
      state:
        await getStateByRGeocoding(parseFloat(lngStr), parseFloat(latStr)),
      source: 'arcgis' });

  //  we don't wait for the location to be saved but we catch any errors
  //  that resulted. we ignore duplicate key errors, which can happen if
  //  many new locations are loaded at once
  cachedLocation
    .save()
    .catch((err) => {
      if (err.code !== 11000) {
        console.error(
          `Error saving cachedLocation (${lngStr}, ${latStr})`,
          err);
      }
    });

  return cachedLocation.get('state');
}

export const _debug = {
  setArcgisToken,
  getArcgisTokenAndExpiry,
  getStateByRGeocoding,
};
