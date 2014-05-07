"use strict";

var FeedHelper = {
  parseFeed: function(feedUrl, onFinish, onError) {
    let listener = {
      handleResult: function handleResult(feedResult) {
        let feedDoc = feedResult.doc;
        let feed = feedDoc.QueryInterface(Ci.nsIFeed);
        onFinish(feed);
      }
    };

    let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
    try {
      xhr.open("GET", feedUrl, true);
    } catch (e) {
      Cu.reportError("Error opening request to " + feedUrl + ": " + e);
      if (onError) {
        onError();
      }
      return;
    }
    xhr.overrideMimeType("text/xml");

    xhr.onerror = function onerror(e) {
      Cu.reportError("Error making request to " + feedUrl + ": " + e.error);
      if (onError) {
        onError();
      }
    };

    xhr.onload = function onload(event) {
      if (xhr.status !== 200) {
        Cu.reportError("Request to " + feedUrl + " returned status " + xhr.status);
        if (onError) {
          onError();
        }
        return;
      }

      let processor = Cc["@mozilla.org/feed-processor;1"].createInstance(Ci.nsIFeedProcessor);
      processor.listener = listener;

      let uri = Services.io.newURI(feedUrl, null, null);
      processor.parseFromString(xhr.responseText, uri);
    };

    xhr.send(null);
  },

  feedToItems: function(feed) {
    function domain(url) {
      let u = url.substr(url.indexOf("//") + 2);
      let e = u.indexOf("/");
      if (e === -1) {
        e = u.length;
      }
      return u.substr(0, e);
    }
    let items = [];

    let item = {
      url: "https://news.ycombinator.com",
      description: domain("https://news.ycombinator.com"),
      title: "HACKER NEWS",
      image_url: "http://me73.com/img/hnw.png"
    };
    items.push(item);

    for (let i = 0; i < feed.items.length; i++) {
      let entry = feed.items.queryElementAt(i, Ci.nsIFeedEntry);
      entry.QueryInterface(Ci.nsIFeedEntry);
      entry.link.QueryInterface(Ci.nsIURI);

      item = {
        url: entry.link.spec,
        description: domain(entry.link.spec),
        title: entry.title.plainText(),
        image_url: "http://me73.com/img/hnwg.png"
      };
      items.push(item);

      // Comment links
      // let link = entry.summary.text;
      // let start = link.indexOf('href="') + 6;
      // let end = link.indexOf('">');
      // link = link.substring(start, end);
      // item = {
        // url: link,
        // title: "..."
      // };

      // items.push(item);
    }
    return items;
  }
};
