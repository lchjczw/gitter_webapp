"use strict";

var path = require('path');
var glob = require('glob');//eslint-disable-line node/no-unpublished-require

module.exports = function(plop) {

  var baseComponentDir = path.resolve(__dirname, '../../shared/containers/components');
  var baseComponentDirs = glob.sync(baseComponentDir + '/*/');
  var componentDirs = ['/'].concat(baseComponentDirs.map(function(folderPath){
    return folderPath.replace(baseComponentDir, '');
  }));

  plop.setGenerator('component', {
    description: 'Generate a react component',
    prompts: [{
      type: 'input',
      name: 'name',
      message: 'What is the name of your component?',
      validate: function (value) {
        if ((/.+/).test(value)) { return true; }
        return 'name is required';
      }
    },
    {
      type: 'list',
      name: 'subFolder',
      message: 'Pick a folder for your component',
      choices: componentDirs,
    }],
    actions: function(data){

      return [{
        type: 'add',
        path: path.resolve(__dirname, '../../shared/containers/components/', '.' + data.subFolder) + '/{{dashCase name}}.jsx',
        templateFile: path.resolve(__dirname, '../templates/component.txt'),
      }, {
        type: 'add',
        path: path.resolve(__dirname, '../../test/specs/shared/containers//components', '.' + data.subFolder) + '/{{dashCase name}}-test.jsx',
        templateFile: path.resolve(__dirname, '../templates/component-test.txt'),
      }];
    }
  });

};