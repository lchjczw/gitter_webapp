import assert from 'assert';
import { shallow } from 'enzyme';
import Backbone from 'backbone';
import React from 'react';
import App from 'gitter-web-topics-ui/browser/js/app.jsx';
1
describe.skip('App', function() {

  it('should set the right state when rendered with the forum route', function(){
    var route = new Backbone.Model({ route: 'forum', groupName: 'gitterHQ' });
    const wrapper = shallow(<App router={route} />);
    assert.equal(wrapper.state('route'), 'forum');
    assert.equal(wrapper.state('groupName'), 'gitterHQ');
  });

  it('should render a ForumContainer when rendered with the forum route', function(){
    var route = new Backbone.Model({ route: 'forum', groupName: 'gitterHQ' });
    const wrapper = shallow(<App router={route} />);
    assert.equal(wrapper.find('ForumContainer').length, 1);
  });

  it('should render a ForumContainer when rendered with the create-topic route', () => {
    var route = new Backbone.Model({ route: 'create-topic', groupName: 'gitterHQ', createTopic: true });
    const wrapper = shallow(<App router={route} />);
    assert.equal(wrapper.find('ForumContainer').length, 1);
    assert.equal(wrapper.state('createTopic'), true);
  });

});
