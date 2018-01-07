//  asynConstant takes a (possibly async) function FCN with optional
//  arguments and returns a wrapper function that returns a promise for the
//  result of running that function.
//
//  The point of this code, as opposed to simply using the result of FCN
//  (presumably, a promise), is that, using asyncConstant, FCN is only
//  called if/when the wrapper function is first run, so that errors can be
//  caught by the surrounding context. Otherwise, if FCN is called whenever
//  it is first encountered, you can end up with uncaught rejected promises
//  if FCN fails.
export default function asyncConstant(fcn, ...args) {
  let promise;
  return async function fcnWrapper() {
    if (!promise) {
      promise = Promise.resolve(fcn(args));
    }
    return promise;
  };
}
