// error class for noting that a group could not be saved
// reason
export default class GroupFailure extends Error {
  constructor(reason, info) {
    super();
    if (reason === undefined) {
      throw new Error('reason cannot be undefined');
    }
    if (!GroupFailure.reasons.includes(reason)) {
      throw new Error('reason must be in GroupError.reasons');
    }
    this.reason = reason;
    if (arguments.length >= 2) {
      this.info = info;
    }
  }
}

//  a list of the allowed GroupError reasons
GroupFailure.reasons = [
  // group lacking a key or key improperly formatted. INFO is keyname(s)
  'MissingKeys',
  // could not normalize state name. INFO is the state.
  'UnknownState',
  // failure involving arcgis. INFO may be relevant error
  'ArcgisFailed',
  // state is not allowed
  'StateNotAllowed',
  // a known bad fburl
  'KnownBadFbUrl',
  // could not parse fburl
  'FbUrlParseFailed',
  // generic reason when querying facebook for the ID
  // INFO will be the same as the value for ref when the
  // FbProfFailReason is 'FacebookQueryFailed' (see
  // DATABASE.md#fbproffailreason)
  'FacebookQueryFailed',
  // thrown when Facebook indicates that it cannot find the profile for the
  // parameters extracted from the URL
  // INFO will be Facebook's response.
  'FacebookQueryBadFbUrl',
];
