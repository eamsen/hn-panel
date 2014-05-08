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

  imageUrl: function(url) {
    return "http://rndpng.me73.com/" + url;
  },

  feedToItems: function(feed) {
    let items = [];

    let item = {
      url: "https://news.ycombinator.com",
      description: "news.ycombinator.com",
      title: "HACKER NEWS",
      // title: img,
      image_url: "http://me73.com/img/hnw.png"
      // image_url: img
    };
    items.push(item);
    //browser.parentNode.removeChild(browser);

    for (let i = 0; i < feed.items.length; i++) {
      let entry = feed.items.queryElementAt(i, Ci.nsIFeedEntry);
      entry.QueryInterface(Ci.nsIFeedEntry);
      entry.link.QueryInterface(Ci.nsIURI);

      let host = entry.link.host;
      if (host.indexOf("www.") == 0) {
        host = host.substr(4);
      }

      item = {
        url: entry.link.spec,
        description: host,
        title: entry.title.plainText(),
        image_url: this.imageUrl(host)
      };
      items.push(item);

      // Comment links
      // let commentLink = entry.summary.text;
      // let start = commentLink.indexOf('href="') + 6;
      // let end = commentLink.indexOf('">');
      // commentLink = commentLink.substring(start, end);
      // item = {
        // url: commentLink,
        // title: "...",
        // image_url: "http://me73.com/img/hnwg.png"
      // };
      // items.push(item);
    }
    return items;
  }
};
