//  This file contains common helper functions for the client

/* eslint-disable import/prefer-default-export */

//  Use fetch to post a Json request to 'url' from the JS object 'object'
//  The object returned is a standard fetch response, i.e.
//   https://developer.mozilla.org/en-US/docs/Web/API/Response
export async function postJsonFetch(url, object) {
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(object),
    credentials: 'same-origin',
  });
}

//  a class indicating that the response in parseFetchresAsJson was not of
//  the expected form. RESPONSE should be the response from
//  fetch. CONTEXT is optional additional information (like, e.g. an
//  error object if BadResponse is the result of a thrown error).
export class BadResponse extends Error {
  constructor(message, response, context = null) {
    super(`Bad response from backend: ${message}`);
    this.response = response;
    this.context = context;
  }

  toString() {
    return this.message;
  }
}

//  Parse a fetch response as JSON assuming that the response respects the
//  Google JSON Style Guide, returning the parsed JSON as a response.
//
//  If the response is an error, the status code will be returned in
//    response.error.code.
//  This is for endpoints that respect the Google JSON Style Guide; thus,
//  an error of type BadResponse is thrown if
//    1) the response is not JSON
//    2) the return status is 2XX but response.error exists;
//    3) the return status is not 2XX but response.error is not given;
//    4) response.error.code is not equal to the return status;
async function parseFetchresAsJson(response) {
  if (response.status === 504) {
    throw new BadResponse('Backend timeout', response);
  }
  let resParsed;
  try {
    resParsed = await response.json();
  } catch (e) {
    throw new BadResponse(`Error parsing json: ${e}`, response, e);
  }

  if ((response.status >= 200 && response.status < 299 && resParsed.error)
      || ((response.status < 200 || response.status >= 300)
          && (!resParsed.error
              || (resParsed.error.code
                  && response.status !== resParsed.error.code)))) {
    throw new BadResponse(
      'The response status code and response.error are incompatible',
      response);
  }

  if (resParsed.error) {
    resParsed.error.code = resParsed.status;
  }
  return resParsed;
}

//  Function for fetching different HTTP methods
//  See comments above parseFetchresAsJson for more info. about response
//
//  GET URL and parse response.
export async function getParseJson(url) {
  const responseRaw = await fetch(url, { credentials: 'same-origin' });
  return parseFetchresAsJson(responseRaw);
}
//  Post OBJECT as JSON to URL, then parse the response.
export async function postParseJson(url, object) {
  const responseRaw = await postJsonFetch(url, object);
  return parseFetchresAsJson(responseRaw);
}
//  DELETE URL and parse response.
export async function deleteParseJson(url) {
  const responseRaw
        = await fetch(url, { method: 'DELETE', credentials: 'same-origin' });
  return parseFetchresAsJson(responseRaw);
}


//  dynamically inject a script into page
//  SRC: source url
//  ISASYNC: should the script be loaded asynchronously?
//  from https://stackoverflow.com/a/39008859
export async function injectScript(src, isAsync = true, isDefer = true) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    if (isAsync) {
      script.async = true;
    }
    if (isDefer) {
      script.defer = true;
    }
    script.src = src;
    script.addEventListener('load', resolve);
    script.addEventListener(
      'error', () => reject(new Error('Error loading script.')));
    script.addEventListener(
      'abort', () => reject(new Error('Script loading aborted.')));
    document.head.appendChild(script);
  });
}

//  return a printable version of a response from the backend in case of an
//    error.
//  It returns an empty string if there is no error.
//  If ASHTML, return the response as html.
//  Note that not all functionality is currently supported.
export function printBackendError(responseJson, asHtml) {
  const { error } = responseJson;
  if (!error) return '';

  if (error.message) {
    return error.message;
  }

  if (error.errors) {
    return (
      'Error(s):\n' // eslint-disable-line prefer-template
        + error.errors.map(
          (oneError, idx) =>
            `${idx + 1}: `
            + `${oneError.message || oneError.reason || oneError.code || ''}`)
    );
  }

  if (error.code) {
    return `Error. HTTP status code: ${error.code}`;
  }

  return 'Backend error lacking more specific information.';
}

export default {
  postJsonFetch, BadResponse, postParseJson, injectScript, printBackendError,
};
