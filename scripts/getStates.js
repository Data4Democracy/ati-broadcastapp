const request = require('request-promise-native');
const fs = require('mz/fs');

async function logRequestError(response, url) {
  const errorLog = 'error.log';
  const logString =
        `${Date()}, ${response.statusCode}:`
        + ` ${response.statusMessage} ${url} \n`;

  try {
    await fs.appendFile(errorLog, logString);
  } catch (error) {
    console.log(error);
  }
}

async function logFailedGroup(group) {
  const failureLog = 'failed_groups.json';
  try {
    await fs.appendFile(failureLog, JSON.stringify(group, null, '  '));
  } catch (error) {
    console.log(error);
  }
}

async function getIndivisibleJSON() {
  async function parseJSON(responseBody) {
    // Indivisible JSON starts with this: 'window.INDIVISIBLE_EVENTS=' which
    // chokes JSON.parse, so use the offset to start parsing after this point.
    const stringOffset = 26;
    return JSON.parse(responseBody.substring(stringOffset));
  }

  async function processJSON(rawJSON) {
    const urlPattern = new RegExp('.*facebook.*');
    // Filter out entries that are not groups and those that don't have
    // Facebook pages
    let filteredJSON = rawJSON.filter(group => (
      group.event_type === 'Group'
        && (group.facebook !== ''
            || urlPattern.test(group.url))
    ));

    // Remove any duplicate groups
    filteredJSON = Array.from(new Set(filteredJSON));

    return filteredJSON;
  }

  const address
        = 'https://d1icy8tq23460g.cloudfront.net/output/indivisible.json';
  const options = { url: address, gzip: true };
  const out = await request(options)
      .then(parseJSON)
      .then(body => processJSON(body))
      .catch(error => logRequestError(error, address));
  return out;
}

async function getCurrentGroups(fileToLoad) {
  const encoding = 'utf8';

  let groupsJSON;
  try {
    groupsJSON = await fs.readFile(fileToLoad, encoding);
  } catch (error) {
    console.log(error);

    // CHECK Is this correct?
    if (error.code === 'ENOENT') { return null; }
  }

  return JSON.parse(groupsJSON);
}

async function updateGroups(fetchedGroups, currentGroups) {
  function sortByLng(a, b) {
    if (a.lng > b.lng) {
      return 1;
    } else if (a.lng < b.lng) {
      return -1;
    }
    return 0;
  }

  const updatedGroups = new Set();
  if (!currentGroups) {
    await Promise.all(
      fetchedGroups.map(async (newInfo) => {
        const newInfoState = await getState(newInfo);

        if (newInfoState) {
          updatedGroups.add(newInfoState);
        } else {
          logFailedGroup(newInfoState);
        }
      }));
  } else {
    fetchedGroups.sort(sortByLng);
    currentGroups.sort(sortByLng);

    await Promise.all(
      fetchedGroups.map(async (newInfoIn) => {
        let newInfo = newInfoIn;

        for (const oldInfo of currentGroups) {
          if (newInfo.lat === oldInfo.lat && newInfo.lng === oldInfo.lng) {
            if (newInfo.title === oldInfo.title) {
              newInfo = oldInfo;
              updatedGroups.add(newInfo);
              break;
            } else {
              newInfo.state = oldInfo.state;
              updatedGroups.add(newInfo);
              break;
            }
          }
        }

        if (!Object.prototype.hasOwnProperty.call(newInfo, 'state')) {
          const backupInfo = newInfo;
          newInfo = await getState(newInfo);

          if (newInfo) {
            updatedGroups.add(newInfo);
          } else {
            logFailedGroup(backupInfo);
          }
        }
      }));
  }

  return Array.from(updatedGroups);
}

async function getState(group) {
  const requestGeocodingData = async function requestGeocodingData(url) {
    let geocodingData = null;
    // Sometimes the Census geocoer chokes on valid input, so it's best to
    // give it a few tries before giving up.
    for (let i = 0; i < 5; i += 1) {
      // we purposely want to block on await here
      // eslint-disable-next-line no-await-in-loop
      geocodingData = JSON.parse(await request(url, (error, response, body) => {
        if (response.statusCode !== 200) {
          logRequestError(response, url);
          return null;
        } else {
          return body;
        }
      }).catch((error) => { console.log(error.statusCode); return null; }));

      if (geocodingData) {
        break;
      }

      if (i === 4) {
        logFailedGroup(group);
        return null;
      }
    }

    if (geocodingData.result.geographies['2010 Census Blocks'].length === 0) {
      logFailedGroup(group);
      return null;
    }

    if (geocodingData.result.geographies.States[0]) {
      return geocodingData.result.geographies.States[0].NAME;
    } else {
      return null;
    }
  };

  // eslint-disable-next-line no-shadow
  const getStateByLatLng = async function getStatesByLatLng(group) {
    if (group) {
      // eslint-disable-next-line max-len
      const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${group.lng}&y=${group.lat}&benchmark=4&vintage=4&format=json`;
      const state = await requestGeocodingData(url).catch(error => null);
      return state;
    } else {
      return null;
    }
  };

  // eslint-disable-next-line no-shadow
  const getStateByAddress = async function getStateByAddress(group) {
    // If there's no address or it's whitespace, return
    if (!group.venue || /^\s+$/.test(group.venue)) {
      return null;
    }
    // eslint-disable-next-line max-len
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${group.venue}&benchmark=4&vintage=4&format=json`;
    const state = await requestGeocodingData(url).catch(error => null);
    return state;
  };

  let state = await getStateByLatLng(group);

  if (!state) {
    state = await getStateByAddress(group);
  }

  if (!state) {
    return null;
  }

  group.state = state;
  group.added = new Date();

  return group;
}

async function main() {
  const currentGroupsFile = 'states.json';
  const indivisibleGroups = await getIndivisibleJSON();
  const currentGroups = await getCurrentGroups(currentGroupsFile);
  const updatedGroups = await updateGroups(indivisibleGroups, currentGroups);

  try {
    await fs.writeFile(
      currentGroupsFile, JSON.stringify(updatedGroups, null, '  '));
  } catch (err) {
    console.log(err);
  }
}

main();
