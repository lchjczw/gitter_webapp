module.exports = {
    "env": {
        "commonjs": true,
        "node": true
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error", "log"] }],
      "node/no-missing-require": "warn"
    }
};
