((root) => {
  'use strict';

  const requestPermission = permission => {
    return new Promise(resolve => {
      chrome.permissions.request({
        permissions: [permission]
      }, granted => {
        root.PersistenceService.set(`${permission}_permission`, granted);
        resolve(granted);
      });
    });
  };

  const queryPermission = permission => {
    return new Promise(resolve => {
      chrome.permissions.contains({
        permissions: [permission]
      }, resolve);
    });
  };

  root.PermissionService = {
    requestPermission,
    queryPermission
  };
})(window);
