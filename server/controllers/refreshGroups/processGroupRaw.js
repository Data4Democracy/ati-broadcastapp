import mongoose from 'mongoose';

import getState from './getState';
import getFbProf from './getFbProf';
import GroupFailure from './GroupFailure';

let BadFbUrl;
let GroupTemp;

function initModels() {
  if (!GroupTemp) GroupTemp = mongoose.model('GroupTemp');
  if (!BadFbUrl) BadFbUrl = mongoose.model('BadFbUrl');
}

// is VAL a non-blank string?
function isNonBlank(val) {
  return Boolean(typeof val === 'string' && val.match(/[^ ]/));
}

//  properties from the downloaded group that are passed through to the
//  group mongo object
const passthroughProperties = [
  'twitter',
  'phone',
  'email',
  'venue',
];

//  process one group from Indivisible JSON file
//
//  USERSPEC is an object {user, ip} specifying the user making the call.
//  STATESALLOWED is an array of allowed states or null if all states are
//   allowed
//
//  Returns an object {group, failures, queryFacebookFl}, where
//   GROUP is a mongoose document,
//   FAILURES is an array of GroupFailure's,
//   QUERYFACEBOOKFL is a boolean indicating if a facebook query was made
export default async function processGroupRaw(
  { groupRaw: { lat, lng, facebook, title, url, ...rest },
    userSpec, statesAllowed }) {
  initModels();

  const group = new GroupTemp();
  const failures = [];
  let queryFacebookFl = false;

  async function handleFailure(fcn, ...args) {
    try {
      await fcn(args);
    } catch (e) {
      if (e instanceof GroupFailure) {
        failures.push(e);
      } else {
        throw e;
      }
    }
  }

  // process the state
  await handleFailure(async () => {
    // we use isMissing because we want to set lat or lng even if the info
    // one is missing
    let isMissing = false;
    Object.entries({ lng, lat }).forEach(([key, val]) => {
      if ([null, undefined].includes(val)) {
        isMissing = true;
      } else {
        // for a couple of groupsRaw, lat, lng are number rather than
        // strings so we use toString here
        group.set(key, val.toString());
      }
    });
    if (isMissing) throw new GroupFailure('MissingKeys', 'lat or lng');

    group.set('state', await getState(
      group.get('lng'), group.get('lat')));
  });

  // next, get the fbProf
  await handleFailure(async () => {
    // no Facebook lookup if no state
    if (!group.get('state')) {
      return;
    }

    if (!isNonBlank(facebook)) {
      throw new GroupFailure('MissingKeys', 'facebook');
    }

    // we want to save fbUrl even if state not allowed
    group.set('fbUrl', facebook);

    // no Facebook lookup if not an allowed state
    // (note that we know state is non-null at this point)
    if (statesAllowed !== null
        && !statesAllowed.includes(group.get('state'))) {
      throw new GroupFailure('StateNotAllowed');
    }

    // since we want to set 1) fbProfFailReason, and 2) badfbUrl, we
    // have to catch certain groupfailures here

    try {
      if (await BadFbUrl.findOne({ fbUrl: facebook })) {
        throw new GroupFailure('KnownBadFbUrl');
      }

      const getFbProfResult = await getFbProf(userSpec, facebook);
      const { fbProf } = getFbProfResult;
      // eslint-disable-next-line prefer-destructuring
      queryFacebookFl = getFbProfResult.queryFacebookFl;

      group.set('fbProfId', fbProf);
    } catch (e) {
      // eslint-disable-next-line prefer-destructuring
      queryFacebookFl = e.queryFacebookFl;
      if (e instanceof GroupFailure) {
        const badFbUrl = new BadFbUrl({ fbUrl: facebook });

        switch (e.reason) {
          case 'FbUrlParseFailed':
            badFbUrl.set('reason', 'UrlParseFailed');
            break;
          case 'FacebookQueryFailed':
            group.set(
              'fbProfFailReason',
              { reason: 'FacebookQueryFailed', ref: e.info });
            break;
          case 'FacebookQueryBadFbUrl':
            badFbUrl.set('reason', 'BadFacebookResponse');
            badFbUrl.set('response', e.info);
            break;
          default:
            break;
        }

        if (badFbUrl.get('reason')) {
          group.set(
            'fbProfFailReason', { reason: 'BadFbUrl', ref: badFbUrl });
          badFbUrl.save().catch((err) => {
            console.error('Error saving badFbUrl', err);
          });
        } else if (badFbUrl.errors) {
          console.error(
            'Error setting badFbUrl for ' + facebook, badFbUrl.errors);
        }
      }
      throw e;
    }
  });

  title && group.set('name', title);
  for (const key of Object.keys(rest)) {
    passthroughProperties.includes(key)
      && group.set(
        key, typeof rest[key] === 'string' ? rest[key].trim() : rest[key]);
  }
  url && group.set('urlOt', url);

  await group.save();

  return { group, failures, queryFacebookFl };
}
