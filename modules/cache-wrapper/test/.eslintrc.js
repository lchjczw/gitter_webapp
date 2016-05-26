module.exports = {
    "env": {
        "commonjs": true,
        "node": true,
        "mocha": true
    },
    "plugins": [
      "mocha"
    ],
    "rules": {
      "mocha/no-exclusive-tests": "error",
      "node/no-unpublished-require": "off",
      "node/no-missing-require": "off"
    }
};
