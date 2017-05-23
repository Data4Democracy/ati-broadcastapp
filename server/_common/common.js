//  Common script files

//  We don't need a default export for this file
/* eslint-disable import/prefer-default-export */

//  Send an appropriately formatted JSON error message.
//  res is the res object in express.
//  The JSON object sent, per the Google JSON Style Guide, will be { error }.
//  Thus, error is generally of the form { code, message, errors }.
//  The status code is taken from error.code if given.
//  If error is a string, code is assumed to be 500.

export function sendError(res, error) {
  if (typeof error === 'string') {
    error = { message: error }; // eslint-disable-line no-param-reassign
  } else if (typeof error !== 'object') {
    throw new Error(`sendError should be a string or an object: ${error}`);
  }
  res.status(error.code || 500).json({ error });
}
