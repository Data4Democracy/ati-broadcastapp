//  This file contains common helper functions for the client

/* eslint-disable import/prefer-default-export */

//  Use fetch to post a Json request to 'url' from the JS object 'object'
export function fetchPostJson(url, object) {
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(object),
  });
}
