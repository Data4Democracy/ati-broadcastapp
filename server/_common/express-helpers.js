//  common functions for writing express responses

const defaultCode = 400;

//  Take an object RESULT that follows the google json guidelines
//  and send it down res.
export function respondJson(res, result) {
  if (result.error) {
    res.status(result.error.code ? result.error.code : defaultCode);
  } else {
    res.status(200);
  }
  res.json(result);
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
//  If ERROR is a string, a single object with no code property, or an
//  array whose first error has no code property, a code of 400 will be
//  used.
//  Similarly, message will be used from ERROR if available but will be
//  blank otherwise.
//  If errorCode is given, use it error.code. Otherwise, use defaultCode
export function makeError(error, errorCode = null) {
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
  errorOut.code = errorCode || defaultCode;

  if (errors[0].message) {
    errorOut.message = errors[0].message;
  }

  return { error: errorOut };
}

//  combines respondJson and makeError, making and sending an error for
//  ERROR
export function respondError(res, error, errorCode = null) {
  respondJson(res, makeError(error, errorCode));
}

//  Convert FCN into an express middleware function.
//  If FCN returns a promise, this will wait until it resolves.
//
//  FCN should be an function that returns a JSON object formatted
//  according to the Google JSON guidelines.
//
//  argFcn is a function that is called when the middleware is run to map
//  (res, req) to an input array that gives the arguments of FCN.
//
//  By default, res, req will be passed to FCN. However, different
//  arguments can be passed to res, req by passing the arguments to
//  middlewareFactory in the argument slots after FCN.
//
//  Why use this? By using this to convert controller functions, the
//  controller functions themselves can have more straightforward inputs
//  and outputs (avoiding having the output be in res.json() or
//  res.status()), making them easier to debug.
export function middlewareFactory(fcn, argFcn = (res, req) => [res, req]) {
  return async (req, res, next) => {
    let resultOrPromise;
    try {
      resultOrPromise = fcn(...(argFcn(req, res)));
    } catch (e) {
      // technically, express can take care of this automatically, without
      // this try...catch statement, but I prefer being explicit
      next(e);
      return;
    }

    let result;
    if (resultOrPromise instanceof Promise) {
      try {
        result = await resultOrPromise;
      } catch (e) {
        //  this try...catch *is* necessary, because it's asynchronous
        next(e);
        return;
      }
    } else {
      result = resultOrPromise;
    }

    //  it's hard to see how respondJson could produce an error, but just
    //  in case, we wrap it in a try...catch block
    try {
      respondJson(res, result);
    } catch (e) {
      next(e);
    }
  };
}
