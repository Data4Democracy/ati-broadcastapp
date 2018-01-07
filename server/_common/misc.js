/**
 * miscellaneous helper functions
 */

import lodash from 'lodash';
import { isV4Format, isV6Format } from 'ip';

import { allStates } from './states';
import { asObjectId } from './mongooseHelpers';

/* eslint-disable max-len */
/**
 * a JSON replacer with improved resolution. in particular, it saves the contents of error objects
 */
export function jsonReplacer(key, val) {
  if (val instanceof Error) {
    return JSON.stringify(val, Object.getOwnPropertyNames(val));
  }
  return val;
}

/**
 * just a simple macro for deep copying an object using JSON. takes the same arguments as JSON.parse
 */
export function deepCopy(...args) {
  return JSON.parse(JSON.stringify(...args));
}

/**
 * copy an object using jsonReplacer instead of the standard JSON replacer
 */
export function deepCopyRep(obj) {
  return deepCopy(obj, jsonReplacer);
}

/**
 * is IP a valid IP address?
 */
export const validIpP = ip => isV4Format(ip) || isV6Format(ip);

/**
 * create an object by applying fcn to elements of arr. if three arguments are given, the second argument is a function that is applied to the keys. if either valFcn or keyFcn throws toObject.noKey, that key is skipped.
 */
function toObject(keys, ...otherArgs) {
  let valFcn;
  let keyFcn;
  if (otherArgs[1] === undefined) {
    [valFcn] = otherArgs;
    keyFcn = key => key;
  } else {
    [keyFcn, valFcn] = otherArgs;
  }
  const obj = {};
  for (const key of keys) {
    try {
      obj[keyFcn(key)] = valFcn(key);
    } catch (e) {
      if (e !== toObject.noKey) {
        throw e;
      }
    }
  }
  return obj;
}

toObject.noKey = {};

export { toObject };

/**
 * validate userSpec, returning undefined if valid or an error object
 */
export function validateUserSpec(userSpec) {
  if (typeof userSpec !== 'object') {
    return new Error('userSpec is not an object');
  }

  const { user, ip } = userSpec;
  const errors = [];

  if (!asObjectId(user)) {
    errors.push('user must be a mongoose object or object id:' + user);
  }

  if (!validIpP(ip)) {
    errors.push('invalid ip:' + ip);
  }

  if (errors.length !== 0) {
    return new Error(errors);
  }

  return undefined;
}

/**
 * validate and parse an statesAllowed variable into an array of states or null if any state allowed
 */
export function parseStatesAllowed(statesAllowed) {
  if (statesAllowed === null) {
    return statesAllowed;
  }

  let statesAllowedParsing = statesAllowed;
  if (typeof statesAllowed === 'string') {
    // note that this throws an error if the formatting is bad. that's
    // fine.
    statesAllowedParsing = JSON.parse(statesAllowedParsing);
  }

  if (statesAllowedParsing instanceof Array) {
    const diff = lodash.difference(statesAllowedParsing, allStates);
    if (diff.length !== 0) {
      throw new Error(
        'Unknown state(s) in states_allowed: '
          + (typeof statesAllowed === 'string'
            ? statesAllowed : JSON.stringify(diff)),
      );
    }
    return statesAllowedParsing;
  }

  throw new Error('Unexpected format for states_allowed:' + statesAllowed);
}
