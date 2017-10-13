//  There are times when we repeatedly need some piece of information that
//  needs to be initially determined asynchronously but, once found, does
//  not change. asyncConstant provides this functionality.
//
//  asyncConstant should be called with an async function (i.e. one that
//  returns a promise for the information desired), with any arguments
//  optionally as arguments past the first: asyncConstant(FCN, ARG1, ...)
//
//  asyncConstant will return a promise factory that generates promises for
//  the desired information
//
//  As a simple example, suppose we repeatedly need the google search
//  result for "platypus". We create the factory:
//    const promiseFactory
//      = asyncConstant(request('https://www.google.com?q=platypus'))
//  Then, whenever we want a promise for the result, we can get one
//    const result = await promiseFactory();
export default function asyncConstant(asyncFcn, ...args) {
  //  resolutionStatus indicates if the promise is unresolved, resolved, or
  //  rejected
  let resolutionStatus;
  //  resolution gives the actual value of the resolution
  let resolution;
  //  the promises that need to be resolved.
  //  each promise is actually an array [resolve, reject].
  const promisesToResolve = [];

  asyncFcn(...args).then(
    (val) => {
      resolutionStatus = 'resolved';
      resolution = val;
      // eslint-disable-next-line no-unused-vars
      for (const [resolve, _reject] of promisesToResolve) {
        resolve(resolution);
      }
    },
    (err) => {
      resolutionStatus = 'rejected';
      resolution = err;
      // eslint-disable-next-line no-unused-vars
      for (const [_resolve, reject] of promisesToResolve) {
        reject(resolution);
      }
    });

  return function promiseFactory() {
    switch (resolutionStatus) {
      case undefined:
        return new Promise((resolve, reject) => {
          promisesToResolve.push([resolve, reject]);
        });
      case 'resolved':
        return Promise.resolve(resolution);
      case 'rejected':
        return Promise.reject(resolution);
      default:
        throw new Error('Should never reach here');
    }
  };
}
