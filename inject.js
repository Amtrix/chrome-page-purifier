
var getXElementTreeXPath = function( element ) {
    var paths = [];
    for ( ; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentNode )  {
        var index = 0;

        for ( var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling ) {
            if ( sibling.nodeType == Node.DOCUMENT_TYPE_NODE )
                continue;

            if ( sibling.nodeName == element.nodeName )
                ++index;
        }

        var tagName = element.nodeName.toLowerCase();
        var pathIndex = "[" + (index+1) + "]";
        paths.unshift( tagName + pathIndex );
    }

    return paths.length ? "/" + paths.join( "/") : null;
};

var removeList = [];
var removeXPathList = [];

var clr = false;
var evilcount = 0;
var insertedNodes = [];
var observer = new WebKitMutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        for(var i = 0; i < mutation.addedNodes.length; i++) {
            var elem = mutation.addedNodes[i];
            var id = $(elem).attr("id");
            var exid = $(elem).attr("data-external-id");
            var txt = $(elem).text();

            if (clr) { $(elem).remove(); continue; }

            
            if (removeList.indexOf(id) > -1) $(elem).remove();
            if (removeList.indexOf(exid) > -1) $(elem).remove();
            if (removeXPathList.indexOf(getXElementTreeXPath(elem)) > -1) $(elem).remove();

            insertedNodes.push(mutation.addedNodes[i]);
        }
    })
});

observer.observe(document, {
    childList: true,
    subtree:true
});


var selectModeOn = false;

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse) {
    if (!sender.tab) { // comes from extension

        if (request.type == 'ELEMENT_SELECT_TOGGLE') {
            if (selectModeOn) {
                selectModeOn = false;
                $("*").css("background-color", "");
                $("*").css("cursor", "");
                $("*").off("mousemove");
                $("*").off("click");
            } else {
                selectModeOn = true;
                var prev = null;
                $("*").on("mousemove", function (event) {
                   if (prev) {
                       $(prev).css("background-color", "");
                       $(prev).css("cursor", "");
                   }
                   prev = event.target;
                   $(event.target).css("background-color", "rgb(250, 100, 100)");
                   $(event.target).css("cursor", "pointer");
                });

                $("*").on("click", function(event) {
                    event.preventDefault();

                    chrome.runtime.sendMessage({
                        type: 'ADD_ELEMENT_FILTER_FOR_HOST',
                        payload: {
                            hostname: window.location.hostname,
                            elem: getXElementTreeXPath(event.target)
                        }
                    }, function(resp) {
                        $(event.target).remove();
                    });

                    return false;
                });
            }
        }

        if (request.type == 'ADD_ERASED_ELEMENTS') {
            var elems = request.payload;
            for (var i = 0; i < elems.length; ++i)
                removeXPathList.push(elems[i]);

            sendResponse({status: 'OK'});
        }

        if (request.type == 'CLEAR_CHANGES') {
            document.body.innerHTML = "Wait...";
            
            chrome.runtime.sendMessage({
                type: 'CLEAR_CHANGES',
                payload: {
                    hostname: window.location.hostname
                }
            }, function(resp) {
                window.location.reload();
            });
        }
    }
});

chrome.runtime.sendMessage({type: 'INIT', payload: {hostname: window.location.hostname}});
