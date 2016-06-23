((root, localStorage) => {
  'use strict';
  const defaults = root.Constants.defaults;
  const getItem = name => {
    const item = localStorage.getItem(name);

    if (item === null) {
      return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
    }

    if (item === 'true' || item === 'false') {
      return item === 'true';
    }

    return item;
  };

  root.PersistenceService = {
    get: getItem,
    set: localStorage.setItem.bind(localStorage),
    remove: localStorage.removeItem.bind(localStorage),
    reset: localStorage.clear.bind(localStorage)
  };

})(window, window.localStorage);
