var request = require('request-promise-native');
var fs = require('fs');

const logRequestError = async function logRequestError(response, url) {
    const errorLog = 'error.log';
    let logString = `${Date()}, ${response.statusCode}: ${response.statusMessage} ${url} \n`;
    new Promise(function (resolve, reject) {
      fs.appendFile(errorLog, logString, function (error, resolution) {
            if (error) {
                reject(error);
            }
            resolve(resolution);
        });
    }).catch(error => console.log(error));
};

const logFailedGroup = async function logFailedGroup(group) {
    const failureLog = 'failed_groups.json';
    new Promise(function (resolve, reject) {
        fs.appendFile(failureLog, JSON.stringify(group, null, '  '), function (error, resolution) {
            if (error) {
                reject(error);
            }
            resolve(resolution);
        });
    }).catch(error => console.log(error));
};

const getIndivisibleJSON = async function getIndivisibleJSON() {

    const parseJSON = async function parseJSON(responseBody) {
        // Indivisible JSON starts with this: 'window.INDIVISIBLE_EVENTS=' which
        // chokes JSON.parse, so use the offset to start parsing after this point.
        const stringOffset = 26;
        return JSON.parse(responseBody.substring(stringOffset));
    };

    const processJSON = async function processJSON(rawJSON) {
        const urlPattern = new RegExp('.*facebook.*');
        // Filter out entries that are not groups and those that don't have
        // Facebook pages
        let filteredJSON = rawJSON.filter(function (group) {
            return group['event_type'] == 'Group'
                && (group['facebook'] != ''
                    || urlPattern.test(group['url']));
        });

        // Remove any duplicate groups
        filteredJSON = Array.from(new Set(filteredJSON));

        return filteredJSON;
    };

    const address = 'https://d1icy8tq23460g.cloudfront.net/output/indivisible.json';
    const options = { url: address, gzip: true };
    let out = await request(options)
        .then(parseJSON)
        .then(body => processJSON(body))
        .catch(error => logRequestError(error, address));
    return out;
};

const getCurrentGroups = async function getCurrentGroups(fileToLoad) {
    const encoding = 'utf8';

    const getGroupsJSON = new Promise(function (resolve, reject) {
        fs.readFile(fileToLoad, encoding, function (error, resolution) {
            if (error) {
                reject(error);
            }
            resolve(resolution);
        });
    });

    let groupsJSON = await getGroupsJSON.catch(error => { console.log(error.code); if (error.code == 'ENOENT') { return null; } });

    return JSON.parse(groupsJSON);
};

const updateGroups = async function updateGroups(fetchedGroups, currentGroups) {
    const sortByLng = function (a, b) {
        if (a.lng > b.lng) {
            return 1;
        } else if (a.lng < b.lng) {
            return -1;
        }
        return 0;
    };

    let updatedGroups = new Set();
    if (!currentGroups) {
        for (let newInfo of fetchedGroups) {
            newInfo = await getState(newInfo);

            if (newInfo) {
                updatedGroups.add(newInfo);
            } else {
                logFailedGroup(newInfo);
            }
        }
    } else {
        fetchedGroups.sort(sortByLng);
        currentGroups.sort(sortByLng);

        for (let newInfo of fetchedGroups) {
            for (let oldInfo of currentGroups) {
                if (newInfo.lat == oldInfo.lat && newInfo.lng == oldInfo.lng) {
                    if (newInfo.title == oldInfo.title) {
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
            if (!newInfo.hasOwnProperty('state')) {
                let backupInfo = newInfo;
                newInfo = await getState(newInfo);

                if (newInfo) {
                    updatedGroups.add(newInfo);
                } else {
                    logFailedGroup(backupInfo);
                }
            }
        }
    }

    return Array.from(updatedGroups);

}

const getState = async function getState(group) {
    const requestGeocodingData = async function requestGeocodingData(url) {
        let result = null;
        // Sometimes the Census geocoer chokes on valid input, so it's best to give
        // it a few tries before giving up.
        for (let i = 0; i < 5; i++) {
            geocodingData = JSON.parse(await request(url, function (error, response, body) {
                if (response.statusCode != 200) {
                    logRequestError(response, url);
                    return null;
                } else {
                    return body;
                };
            }).catch(error => { console.log(error.statusCode); return null; }));

            if (geocodingData) {
                break;
            }

            if (i == 4) {
                logFailedGroup(group);
                return null;
            }
        }

        if (geocodingData.result.geographies['2010 Census Blocks'] == []) {
            logFailedGroup(group);
            return null;
        }

        if (geocodingData.result.geographies.States[0]) {
            return geocodingData.result.geographies.States[0].NAME;
        } else {
            return null;
        }

    }

    const getStateByLatLng = async function getStatesByLatLng(group) {
        if (group) {
            let url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${group.lng}&y=${group.lat}&benchmark=4&vintage=4&format=json`;
            let state = await requestGeocodingData(url).catch(error => { return null; });
            return state;
        } else {
            return null;
        }
    };

    const getStateByAddress = async function getStateByAddress(group) {
        // If there's no address or it's whitespace, return
        if (!group.venue || /^\s+$/.test(group.venue)) {
            return null;
        }
        let url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${group.venue}&benchmark=4&vintage=4&format=json`;
        let state = await requestGeocodingData(url).catch(error => { return null; });
        return state;
    }

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

const main = async function main() {
    let currentGroupsFile = 'states.json';
    let indivisibleGroups = await getIndivisibleJSON();
    let currentGroups = await getCurrentGroups(currentGroupsFile);
    let updatedGroups = await updateGroups(indivisibleGroups, currentGroups);
    new Promise(function (resolve, reject) {
        fs.writeFile(currentGroupsFile, JSON.stringify(updatedGroups, null, '  '), function (error, resolution) {
              if (error) {
                  reject(error);
              }
              resolve(resolution);
          });
      }).catch(error => console.log(error));
};

main();