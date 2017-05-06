chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//  console.log(request);

  if (request.type == 'INIT') {
      var host = request.payload.hostname;
      var key = "FILTERED_ELEMS_FOR" + host;
      chrome.storage.sync.get(key, function(obj) {
          var res = [];
          if (obj && obj[key]) res = obj[key];

          chrome.tabs.sendMessage(sender.tab.id, {type: "ADD_ERASED_ELEMENTS", payload: res}, function(response) {
           // console.log("RESP: " + key);
           // console.log(obj);
           // console.log(res);
          });
      });
  }

  if (request.type == 'ADD_ELEMENT_FILTER_FOR_HOST') {
      var host = request.payload.hostname;
      var key = "FILTERED_ELEMS_FOR" + host;
      var item = request.payload.elem;

      chrome.storage.sync.get(key, function(obj) {
          
          var res = [];
          if (obj && obj[key])
            res = obj[key];
          res.push(item);

          var store = {};
          store[key] = res;
          chrome.storage.sync.set(store, function(resp) {
              sendResponse({status: 'OK', newList: res});
          });
      });
  }

  if (request.type == 'CLEAR_CHANGES') {
      var host = request.payload.hostname;
      var key = "FILTERED_ELEMS_FOR" + host;

      chrome.storage.sync.remove(key, function() {
          sendResponse({status: 'OK'});
      });
  }
});