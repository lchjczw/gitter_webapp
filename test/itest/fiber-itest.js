/*jslint node: true */
/*global describe: true it: true */
"use strict";

var Fiber = require("../../server/utils/fiber");

var assert = require("better-assert");

// NOTE: on localhost this test will need to run with a larger mocha timeout (10s) which is done on command line with - t 10s
describe('Fiber', function() {
  describe('#sync()', function() {
    it('should wait for all waitor() promises before executing', function(done){
      var fiber = new Fiber(), firstCallbackHasRun, secondCallbackHasRun, syncCallbackHasRun;

      /* Setup synchronization */

      var firstWaitor = fiber.waitor();
      setTimeout(firstCallback, 1000);

      var secondWaitor = fiber.waitor();
      setTimeout(secondCallback, 100);

      fiber.sync().then(syncCallback);

      /* Callbacks */

      function firstCallback() {
        console.log("First callback run");
        assert(firstCallbackHasRun !== true);
        //assert(secondCallback !== true);
        assert(syncCallbackHasRun !== true);

        firstCallbackHasRun = true;

        return firstWaitor.apply(this, arguments);
      }

      function secondCallback() {
        console.log("Second callback run");
        //assert(firstCallbackHasRun === true);
        assert(secondCallbackHasRun !== true);
        assert(syncCallbackHasRun !== true);

        secondCallbackHasRun = true;

        return secondWaitor.apply(this, arguments);
      }

      function syncCallback() {
        console.log("Sync callback run");
        assert(firstCallbackHasRun === true);
        assert(secondCallbackHasRun === true);
        assert(syncCallbackHasRun !== true);

        syncCallbackHasRun = true;

        done();
      }

    });
  });
});