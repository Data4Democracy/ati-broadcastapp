//  this is for cron jobs. in particular, routes here are only considered
//  if being run from either a local server or if the user is an admin

import express from 'express';

import { validateUserSpec } from '../_common/misc';
import refreshGroups from '../controllers/refreshGroups';

const router = express.Router();

/**
 * Add a cron get route with PATH from CONTROLLER. CONTROLLER will be called with userSpec = { user, ip } followed by ARGS (if any).
 */
function addCronRoute(path, controller, ...args) {
  router.get(path, (req, res, next) => {
    const startTime = new Date();
    const userSpec = { user: res.locals.user, ip: req.ip };

    const userSpecValidation = validateUserSpec(userSpec);

    if (userSpecValidation instanceof Error) {
      console.error(userSpecValidation);
      if (req.app.locals.isProduction) {
        throw new Error('Error making cron request');
      } else {
        throw userSpecValidation;
      }
    }

    controller(userSpec, ...args).catch((err) => {
      console.error(
        `Error running cron job for ${path} started at ${startTime}`
          + `, with error at ${new Date()}`,
        err);
    });

    res.status(200);
    res.send();
  });
}

addCronRoute('/refresh-groups', refreshGroups);
addCronRoute('/refresh-groups-force', refreshGroups, { skipHash: true });
addCronRoute(
  '/refresh-groups-limited', refreshGroups,
  { skipHash: true, groupsFilter: groups => groups.slice(0, 2500) });

export default router;
