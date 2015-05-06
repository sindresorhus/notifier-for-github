'use strict';
var assert = require('assert');
var sinon = require('sinon');
global.window = {
  location:{
    hash: "",
    host: "",
    hostname: "",
    href: "",
    origin: "",
    pathname: "",
    port: "",
    protocol: "",
    search: ""
  }
};
function XMLHttpRequest(){
    this.requestHeaders = {};
    this.responseHeaders = {};
}

XMLHttpRequest.prototype.open = function open(method,url){
    this.method = method;
    this.url = url;
};

XMLHttpRequest.prototype.send = function send(){
    this.readyState = 4;
    this.responseText = '[]';
    this.status = 200;
    this.responseHeaders['X-Poll-Interval'] = '60';
    if(this.onreadystatechange){
        setTimeout(this.onreadystatechange,50);
    }
};

XMLHttpRequest.prototype.setRequestHeader = function setRequestHeader(name,val){
    this.requestHeaders[name] = val;
};

XMLHttpRequest.prototype.getHeader = function getHeader(name){
    return this.responseHeaders[name];
};

global.XMLHttpRequest = XMLHttpRequest;
var chromeStub = require('chrome-stub');
var localMock = new require('mock-localstorage')();
global.localStorage = localMock;
global.chrome = chromeStub;
describe('main',function(){
  it('should register alarm callback',function(){
    require('../extension/api');
    require('../extension/main');
    assert(chromeStub.alarms.create.called);
  });
  it('should do something on alarm fired',function(done){
    var oldNotifCount = global.window.gitHubNotifCount;
    global.window.gitHubNotifCount = sinon.stub();
    process.nextTick(function(){
      chromeStub.alarms.onAlarm.trigger();
      assert(global.window.gitHubNotifCount.called);
      global.window.gitHubNotifCount = oldNotifCount;
      done();
    });
  });
});
