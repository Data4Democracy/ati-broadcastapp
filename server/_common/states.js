//  helper scripts for evaluating groups

//  Taken from https://en.wikipedia.org/wiki/List_of_U.S._state_abbreviations
//  map full state names to abbeviations
export const mapStateAbbrevFromFull = {
  'alabama': 'al',
  'alaska': 'ak',
  'arizona': 'az',
  'arkansas': 'ar',
  'california': 'ca',
  'colorado': 'co',
  'connecticut': 'ct',
  'delaware': 'de',
  'district of columbia': 'dc',
  'washington, d.c.': 'dc',
  'washington, dc': 'dc',
  'florida': 'fl',
  'georgia': 'ga',
  'hawaii': 'hi',
  'idaho': 'id',
  'illinois': 'il',
  'indiana': 'in',
  'iowa': 'ia',
  'kansas': 'ks',
  'kentucky': 'ky',
  'louisiana': 'la',
  'maine': 'me',
  'maryland': 'md',
  'massachusetts': 'ma',
  'michigan': 'mi',
  'minnesota': 'mn',
  'mississippi': 'ms',
  'missouri': 'mo',
  'montana': 'mt',
  'nebraska': 'ne',
  'nevada': 'nv',
  'new hampshire': 'nh',
  'new jersey': 'nj',
  'new mexico': 'nm',
  'new york': 'ny',
  'north carolina': 'nc',
  'north dakota': 'nd',
  'ohio': 'oh',
  'oklahoma': 'ok',
  'oregon': 'or',
  'pennsylvania': 'pa',
  'rhode island': 'ri',
  'south carolina': 'sc',
  'south dakota': 'sd',
  'tennessee': 'tn',
  'texas': 'tx',
  'utah': 'ut',
  'vermont': 'vt',
  'virginia': 'va',
  'washington': 'wa',
  'west virginia': 'wv',
  'wisconsin': 'wi',
  'wyoming': 'wy',
  'american samoa': 'as',
  'guam': 'gu',
  'northern mariana islands': 'mp',
  'puerto rico': 'pr',
  'u.s. virgin islands': 'vi',
  'st croix': 'vi',
  'u.s. minor outlying islands': 'um',
  'baker island': 'xb',
  'howland island': 'xh',
  'jarvis island': 'xq',
  'johnston atoll': 'xu',
  'kingman reef': 'xm',
  'midway islands': 'qm',
  'navassa island': 'xv',
  'palmyra atoll': 'xl',
  'wake island': 'qw',
  'micronesia': 'fm',
  'marshall islands': 'mh',
  'palau': 'pw',
  'u.s. armed forces – americas': 'aa',
  'u.s. armed forces – europe': 'ae',
  'u.s. armed forces – pacific': 'ap',
};

/**
 * all the states allowed
 */
export const allStates = [...new Set(Object.values(mapStateAbbrevFromFull))];

//  try to normalized a state name. if it is already an abbreviation, leave
//  it alone. otherwise, check in mapStateAbbrevFromFull.
//  return null if can't be normalied
export function normalizeStateName(name) {
  const lcName = name.toLowerCase();
  if (allStates.includes(lcName)) {
    return lcName;
  } else {
    return mapStateAbbrevFromFull[lcName] || null;
  }
}

export default {
  normalizeStateName,
};
