"use strict";

module.exports = function forumStore(data) {

  //Defaults
  data = (data || {});

  //Get data
  const get = (key) => data[key];

  //Methods
  return {
    get: get,
    data: data,
    getForum: () => {
      return data;
    },
    getForumId: () => {
      return data.id;
    },
    getIsWatching: () => {
      return data.isWatching;
    },
  };
};
