/**
 * functionality for parsing a facebook url
 */

import mongoose from 'mongoose';
import l_ from 'lodash';

import { fbRequest } from '../_common/fbRequestFcns';
import GroupFailure from './GroupFailure';

let FbProf;

function initModels() {
  if (!FbProf) FbProf = mongoose.model('FbProf');
}

//  regex patterns used for interpreting Facebook URL's
//  this is used with parseFbUrl
const fbUrlPatts = {};
fbUrlPatts.idOtPatt = '([0-9]{5,})';
fbUrlPatts.usernamePatt = '([0-9a-zA-Z.-]+)';
fbUrlPatts.conameIdOtPatt
  = `${fbUrlPatts.usernamePatt}-${fbUrlPatts.idOtPatt}`;

//  Try to extract relevant info from an fbUrl
//
//  If this succeeds, an object is returned:
//    { idOt, coname, username, type }
//  Any of the fields may be missing if they cannot be determined but
//  either a) username and type, or b) idOt will definitely be given
//
//  Return null if FBURL cannot be meaningfully parsed.
function parseFbUrl(fbUrl) {
  // like regular string.replace but pattern is always regexp
  function repReg(string, pattern, rep) {
    return string.replace(new RegExp(pattern), rep);
  }

  //  first, clean URL
  let toParse = fbUrl.toLowerCase();
  //  strip https://
  toParse = repReg(toParse, '^https?://', '');
  // remove initial facebook.com after rejecting unwanted prefixes
  toParse = repReg(toParse, '^(m|www)\\.facebook\\.com/', 'facebook.com/');
  if (!toParse.startsWith('facebook.com')) return null;
  toParse = repReg(toParse, '^facebook\\.com/', '');
  //  remove any query parameters
  toParse = repReg(toParse, '\\?.*', '');
  //  remove any leading 'pg/'
  toParse = repReg(toParse, '^pg/', '');

  const { idOtPatt, conameIdOtPatt, usernamePatt } = fbUrlPatts;

  let match;

  //  note that any matches using conameIdOtPatt has to preceed those using
  //  usernamePatt because conameIdOtPatt is a subset of usernamePatt

  match = toParse.match(`^groups/${idOtPatt}(/.*)?$`);
  if (match) return { type: 'group', idOt: match[1] };

  match = toParse.match(`^groups/${usernamePatt}(/.*)?$`);
  if (match) return { type: 'group', username: match[1] };

  // anything else that starts with groups is an error
  if (toParse.match('^groups(/.*)?$')) return null;

  match = toParse.match(`^${idOtPatt}(/.*)?$`);
  if (match) return { type: 'page', idOt: match[1] };

  match = toParse.match(`^${conameIdOtPatt}(/.*)?$`);
  if (match) return { type: 'page', coname: match[1], idOt: match[2] };

  match = toParse.match(`^${usernamePatt}(/.*)?$`);
  if (match) return { type: 'page', username: match[1] };

  return null;
}

//  Indicate if username is safe to send to the Facebook graph API as a
//  request.
//
//  Return true if username appears safe.
//  Right now, we just check that it only has the characters that we
//    consider valid for a username
//
//  [Since we send the username to the Facebook graphi API as a request, it
//    is a potential attack vector.]
function isUsernameSafe(username) {
  return Boolean(username.match(new RegExp(fbUrlPatts.usernamePatt)));
}

//  add fburls receiving these error codes to the fail list
const badFbUrlErrorCodes = [803];

const commonQueryString = 'fields=id,name';
const debugType = 'queryFacebookForFbProf';

/**
 * get a FacebookQueryFailed error
 */
const makeFacebookQueryFailedError = (reason, more) => (
  new GroupFailure(
    'FacebookQueryFailed', { reason, ...more ? { more } : null }));

//  query the graph API for information about a profile with USERNAME,
//  TYPE.
//
//  USERSPEC is an object { user, ip }, giving specifications about the
//  requesting user
//
//  returns an FbProf-like object { idOt, name, type }
//
//  throw GroupFailure if no profile found
async function queryFacebookForFbProf(
  { fbUrl, userSpec, parsedUrl: { username, type } }) {
  //  we treat these errors separately because they shouldn't happen and
  //  thus reflect a failure in the logic somewhere
  if (!isUsernameSafe(username)) {
    throw new Error(`unsafe username: ${username}`);
  }
  if (!['group', 'page'].includes(type)) {
    throw new Error(`unknown type for [username, type]: ${[username, type]}`);
  }

  /**
   *  check for a badFbUrl and throw an error if appropriate
   */
  const handleBadFbUrl = (body) => {
    if (body) {
      if (body.error) {
        if (badFbUrlErrorCodes.includes(body.error.code)) {
          throw new GroupFailure('FacebookQueryBadFbUrl', body);
        }
        // if no error
      } else if (body.data) {
        if (body.data.length === 0) {
          throw new GroupFailure('FacebookQueryBadFbUrl', body);
        }
      }
    }
  };

  try {
    /* eslint-disable no-throw-literal */
    switch (type) {
      case 'page':
      {
        const response = await fbRequest({
          req: `${username}?${commonQueryString}&metadata=1`,
          metadata: { ...userSpec, type: debugType, address: fbUrl },
        });
        const { body } = response;
        handleBadFbUrl(body);
        if (body.error) {
          throw makeFacebookQueryFailedError('BadResponse', body);
        }
        return {
          idOt: body.id,
          name: body.name,
          type: body.metadata.type,
        };
      }
      case 'group':
      {
        const response = await fbRequest({
          req: (
            `search?q=${encodeURIComponent(username)}`
              + `&type=group&${commonQueryString}`),
          metadata: { ...userSpec, type: debugType, address: fbUrl },
        });
        const { body } = response;
        handleBadFbUrl(body);
        if (body.error) {
          throw makeFacebookQueryFailedError('BadResponse', body);
        }
        return {
          idOt: body.data[0].id,
          name: body.data[0].name,
          type: 'group',
        };
      }
      default:
        throw makeFacebookQueryFailedError('Should never reach here');
    }
    /* eslint-enable no-throw-literal */
  } catch (e) {
    if (e instanceof GroupFailure) throw e;
    else throw makeFacebookQueryFailedError('Unknown', e);
  }
}

//  Convert a fbUrl entry for a group or page to a Facebook ID
//
//  USERSPEC is as in processGroupRaw
//
//  Returns { fbProf, queryFacebookFl } ,
//    where fbProf is a FBProfile mongoose object,
//    and queryFacebookFl indicates if facebook was queried
//
//  throws on failure. the thrown error will still have a property
//    queryFacebookFl indicating if facebook was queried
export default async function getFbProf(userSpec, fbUrl) {
  initModels();

  // we have to surround in try...catch so we can set queryFacebookFl
  let queryFacebookFl = false;
  try {
    // we first check if FbProf for FACEBOOK is already known
    let fbProf = await FbProf.findOne({ urlAliases: fbUrl });
    if (fbProf) return { fbProf, queryFacebookFl };

    //  next, we try to parse the fbUrl
    const parsedUrl = parseFbUrl(fbUrl);
    if (!parsedUrl) throw new GroupFailure('FbUrlParseFailed');

    /**
     * the fields of an FbProf used, as necessary, to generate an FbProf
     */
    let fbProfObj;

    if (parsedUrl.idOt) {
      const { coname, type } = parsedUrl;
      fbProfObj = {
        idOt: parsedUrl.idOt,
        isCertain: false,
        ...coname && { name: coname },
        ...type && { type },
        urlAliases: [fbUrl],
      };
    } else {
      //  by stipulation, if parseFbUrl does not return null or have idOt,
      //  it will have both username and type and is a proper input for
      //  queryFacebookForFbProf
      queryFacebookFl = true;
      const queryResponse
        = await queryFacebookForFbProf({ userSpec, fbUrl, parsedUrl });
      fbProfObj = { ...queryResponse, isCertain: true, urlAliases: [fbUrl] };
    }

    // save new fbProf and wait for completion. Note that there might
    // already exist and fbProf with the idOt or the fbUrl in an FbProf's
    // urlAliases.  these can happen if an appropriate FbProf is added (or
    // if fbUrl is added to a FbProb) between when we checked the database
    // for the existance of the fbUrl and now
    //
    // we don't check for conflict; rather,
    // we catch any duplicate key error that occur and then try to
    // appropriate modify the existing fbProf
    try {
      fbProf = await FbProf.create(fbProfObj);
    } catch (eOuter) {
      try {
        // test for duplicate key errors
        if (eOuter.code !== 11000) {
          throw eOuter;
        }

        // a duplicate key error occurs either because
        //   1) the idOt but not the urlAlias already exists on an FbProf
        //   2) the fbUrl already exists in an FbProf's urlAliases
        //
        // assuming we are in case 1, let us try to add the fbUrl to the
        // existing fbProf's urlAlias (in case 2, $addToSet will do nothing
        // but the correct FbProf will be returned) and, if isCertain,
        // update the fbProf properties
        fbProf = await FbProf.findOneAndUpdate(
          { idOt: fbProfObj.idOt },
          { $addToSet: { urlAliases: fbUrl },
            ...fbProfObj.isCertain && l_.omit(fbProf, 'urlAliases'),
          },
          { new: true });
      } catch (e) {
        throw makeFacebookQueryFailedError('FbProfSaveFailed', e);
      }
    }
    if (!fbProf) {
      throw makeFacebookQueryFailedError(
        'FbProfUnexpectedUndefined',
        `fbProf unexpectedly undefined for ${fbUrl}: ${fbProf}`,
      );
    }
    return { fbProf, queryFacebookFl };
  } catch (e) {
    e.queryFacebookFl = queryFacebookFl;
    throw e;
  }
}

export const _debug = {
  fbUrlPatts,
  parseFbUrl,
  isUsernameSafe,
  badFbUrlErrorCodes,
  queryFacebookForFbProf,
};
