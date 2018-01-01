/**
 * functionality for getting the raw groups
 */

import cheerio from 'cheerio';
import request from 'request-promise-native';
import urlLib from 'url';

/**
 * get the url for the JSON and download it
 */
export async function downloadJson() {
  // first, get the URL
  const indivPageUrl = 'https://www.indivisible.org/act-locally/';
  const $indivisiblePage = cheerio.load(await request(indivPageUrl));

  const mapUrlObj = new urlLib.URL(urlLib.resolve(
    indivPageUrl, $indivisiblePage('#indivisible-map').attr('src')));

  const { protocol, auth, host } = mapUrlObj;
  const jsonUrl = urlLib.resolve(
    protocol + '//' + (auth ? auth + '@' : '') + host,
    '/output/indivisible.json');
  return request(jsonUrl, { gzip: true });
}

/**
 * get the raw groups object from the downloaded file
 */
export function extractGroupsRaw(downloadedJson) {
  //  the downloaded "json" file, strangely, is of the form 'variable={...}'
  return JSON.parse(downloadedJson.slice(downloadedJson.indexOf('=') + 1));
}

