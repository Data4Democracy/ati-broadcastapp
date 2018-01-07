import mongoose from 'mongoose';
import lodash from 'lodash';

import getConfigPromise, { gaeGetMetadata } from '../../config';
import { parseStatesAllowed } from '../../_common/misc';

import GroupFailure from './GroupFailure';
import { downloadJson, extractGroupsRaw } from './getGroupsRaw';
import processGroupRaw from './processGroupRaw';

let Group;
let GroupTemp;
let Adminsetting;

let config;

function initModels() {
  if (!Group) Group = mongoose.model('Group');
  if (!GroupTemp) GroupTemp = mongoose.model('GroupTemp');
  if (!Adminsetting) Adminsetting = mongoose.model('Adminsetting');
}

//  refresh groups from indivisible
//
//  required specifications:
//  user, ip: specify who is making the request
//
//  optional specifications:
//  groupsFilter: a function applied to the groups before further processing
//  skipHash: if true, skip checking the hash (i.e. always refresh
//   groups). Note that the has of the newly updated groups will still be
//   saved
//
//  returns:
//  if downloadedJson unchanged: null
//  if a different fatal error, will return an Error object, with the error
//    causing the failure stored in an error property
//  if downloadedJson changed: an object with stats
//     { raw, {failures: NoFailures, GroupFailure.reasons[0], ...},
//       facebookQueries },
//  where each entry is the number of groups in the corresponding category.
//  RAW: total number of raw (i.e. unprocessed) groups (after applying
//    groupsFilter)
//  NOFAILURES: groups with no failures,
//  The rest are tallied from GroupFailure.reasons
//  FACEBOOKQUERIES: number of facebook queries made in the search
export default async function refreshGroups(userSpec, opts) {
  // opts can be omitted
  const { groupsFilter, skipHash }
    = lodash.merge(
      {}, { groupsFilter: lodash.identity, skipHash: false }, opts || {});

  initModels();

  console.log('Refreshing groups');

  // grouptemps should not already exist
  if ((await GroupTemp.collection.count()) > 0) {
    throw new Error('Cannot refresh groups if grouptemps already exists');
  }

  // make sure GroupTemp has its indices before proceeding
  await GroupTemp.ensureIndexes();

  let downloadedJson = await downloadJson();
  console.log('Downloaded json from Indivisible');

  //  is the downloaded groups document different from the previous download?
  const hash = Group.hashGroupsRaw(downloadedJson);
  if (!skipHash) {
    const savedHashDoc
          = await Adminsetting.findOne({ name: 'groupsRawHash' });
    if (savedHashDoc && savedHashDoc.get('groupsRawHash') === hash) {
      console.log('Group download unchanged');
      return null;
    }
  }
  const groupsRaw = groupsFilter(extractGroupsRaw(downloadedJson));
  downloadedJson = null; // don't need downloadedJson anymore

  const tally = {
    raw: groupsRaw.length,
    facebookQueries: 0,
    failures: { },
  };

  [...GroupFailure.reasons, 'NoFailures']
    .forEach((reason) => { tally.failures[reason] = 0; });
  tally.raw = groupsRaw.length;

  // refresh statesAllowed
  if (!config) {
    config = await getConfigPromise();
  }
  const statesAllowed
    = (config.get('is_gae')
      ? parseStatesAllowed(await gaeGetMetadata('attributes/states_allowed'))
      : config.get('states_allowed'));

  console.log('statesAllowed', statesAllowed);

  // process the groups
  await Promise.all(
    groupsRaw.map(
      async (groupRaw) => {
        const { group, failures: groupFailures, queryFacebookFl }
          = await processGroupRaw({ groupRaw, userSpec, statesAllowed });
        if (queryFacebookFl) tally.facebookQueries += 1;
        if (groupFailures.length === 0) {
          tally.failures.NoFailures += 1;
        } else {
          //  isTallied is set to true when a particular failure is taliied
          //  to avoid tallying a given failure type more than once per
          //  group
          const isTallied = {};
          for (const failure of groupFailures) {
            if (!isTallied[failure.reason]) {
              tally.failures[failure.reason] += 1;
              isTallied[failure.reason] = true;
            }
          }

          // don't print error messages for MissingKeys, KnownBadFbUrl,
          // StateNotAllowed
          const filteredFailures
                = groupFailures.filter(
                  failure => !(
                    ['MissingKeys', 'KnownBadFbUrl', 'StateNotAllowed']
                      .includes(failure.reason)));

          if (filteredFailures.length !== 0) {
            console.error('---\nGroup failed: ', groupRaw);

            filteredFailures.forEach((failure) => {
              console.error('Reason:', failure.reason);
              // eslint-disable-next-line no-prototype-builtins
              if (failure.hasOwnProperty('info')) {
                console.error('Info: ', failure.info, '\n');
              }
            });
          }
        }
        return group;
      },
    ),
  );

  await mongoose.connection.db.renameCollection(
    GroupTemp.collection.name, Group.collection.name, { dropTarget: true });

  // save new hash
  await Adminsetting.update(
    { name: 'groupsRawHash' },
    { name: 'groupsRawHash', groupsRawHash: hash },
    { upsert: true });

  console.log(tally);

  return tally;
}
