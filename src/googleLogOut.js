// function for google logout

import { injectScript } from './common-client';

export default async function googleLogOut() {
  if (!window.gapi) {
    await injectScript('https://apis.google.com/js/api.js');
  }
  if (!window.gapi.auth2) {
    await new Promise(
      (resolve, reject) => window.gapi.load('auth2', {
        callback: resolve,
        onerror: () => reject(new Error('gapi.auth2 failed to load')),
        timeout: 5000,
        ontimeout: () => reject(new Error('gapi.auth2 timed-out on load ')),
      }));
  }

  const auth2 = window.gapi.auth2.getAuthInstance();
  if (auth2) await auth2.disconnect();
}
