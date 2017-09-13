//  common functions for writing express responses

const defaultCode = 400;

//  Take a json result JSONRESULT that follows the google json guidelines
//  and send it down res
//  for debugging, we separate the function request that makes the request
//  from the express pipeline.
export function jsonRespond(res, jsonResult) {
  if (jsonResult.error) {
    res.status(jsonResult.error.code ? jsonResult.error.code : defaultCode);
  } else {
    res.status(200);
  }
  res.json(jsonResult);
}

//  Make an appropriately formatted JSON object for an error.
//
//  ERROR can be 1) message: a string; 2) error: a single error object;
//               3) errors: an array of error objects.
//
//  The result will be a JSON object of the form (per the
//  Google JSON Style Guide):
//    { error: { code, message, errors: [{ error, ... }]}}
//
//  If ERROR is a string, an single object with no code property, or an
//  array whose first error has no code property, a code of 400 will be
//  used.
//  Similarly, message will be used from ERROR if available but will be
//  blank otherwise.
export function makeError(error) {
  let errors;
  if (typeof error === 'string') {
    errors = [{ message: error, code: defaultCode }];
  } else if (typeof error === 'object') {
    errors = [error];
  } else if (error instanceof Array) {
    errors = error;
  } else {
    throw new Error(
      `error must be a string, object, or array of objects: ${error}`);
  }

  const errorOut = { errors };
  //  try to find code and message
  errorOut.code = errors[0].code ? errors[0].code : defaultCode;
  if (errors[0].message) {
    errorOut.message = errors[0].message;
  }

  return { errorOut };
}

//  combines jsonRespond and makeError, making and sending an error for
//  ERROR
export function sendError(res, error) {
  jsonRespond(res, makeError(error));
}
