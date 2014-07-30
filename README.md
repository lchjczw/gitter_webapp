Gitter Webapp
=============

Copyright Troupe Technology Limited 2012 - 2014
All rights reserved.

Please symlink pre-commit to .git/hooks/pre-commit to enable the pre-commit hooks.

Prerequisites
-------------
Redis 2.8 (Sentinel 2 is shipped with Redis 2.8) & MongoDB 2.4 must be installed.

Getting Started
---------------
1.  `npm install`
2.  `grunt less`
3.  `./mongodb.sh`
4.  `./redis.sh`
5.  `./scripts/mongo/init-dev-mongo.sh`
6.  `./scripts/upgrade-data.sh`
7.  `nodemon` (this will run node and restart when anything changes based on config in nodemon.json)

Data Upgrades
-------------
`./scripts/upgrade-data.sh` will run through the contents of scripts/dataupgrades and are ment to update mongo's contents idempotently (running the script multiple times will have no effect).

This is run as part of the beta build, but is **not** run as part of a production build. The *individual* upgrade script must be run manually.

* dev: run `./scripts/upgrade-data.sh` yourself
* beta: updated automatically as part of the make task
* prod: run the individual script yourself. e.g `./scripts/dataupgrades/001-oauth-client/002-add-redirect-uri.sh mongo-replica-member-003/gitter`

Run Like Production
-------------------
1.  `make grunt`
2.  `node web --web:staticContent=public-processed/ --web:minified=true`

Utility Scripts
---------------
These are scripts that can help you answer questions like "What's this user's eyeball state?" and "What's the userId for mydigitalself?". They can be found in `scripts/utils`.

If you want to run against production, ssh into app-00X and run with the NODE_ENV varible set.

e.g `NODE_ENV=prod /opt/gitter/gitter-webapp/scripts/utils/unread.js trevorah`

### online-state.js
Prints the current online state for a user. Requires a username.

e.g `./scripts/utils/online-state.js trevorah`

### unread.js
Lists out why a user has an unread badge. Requires a username.

e.g `./scripts/utils/unread.js trevorah`

### suggested-rooms.js
Lists out the rooms suggested to a user. Requires a username.

e.g `./scripts/utils/suggested-rooms.js trevorah`
