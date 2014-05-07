const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/Home.jsm");
Cu.import("resource://gre/modules/HomeProvider.jsm");
Cu.import("resource://gre/modules/Prompt.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const PANEL_ID = "hn.panel@me73.com";
const DATASET_ID = "hn.panel@me73.com";

const FEED_URL = "https://news.ycombinator.com/rss";

XPCOMUtils.defineLazyGetter(this, "Strings", function() {
  return Services.strings.createBundle("chrome://hnpanel/locale/hnpanel.properties");
});

XPCOMUtils.defineLazyGetter(this, "FeedHelper", function() {
  let win = Services.wm.getMostRecentWindow("navigator:browser");
  Services.scriptloader.loadSubScript("chrome://hnpanel/content/FeedHelper.js", win);
  return win["FeedHelper"];
});

function optionsCallback() {
  return {
    title: Strings.GetStringFromName("title"),
    views: [{
      type: Home.panels.View.LIST,
      dataset: DATASET_ID,
      onrefresh: refreshDataset
    }]
  };
}

function refreshDataset() {
  FeedHelper.parseFeed(FEED_URL, function(parsedFeed) {
    let items = FeedHelper.feedToItems(parsedFeed);

    Task.spawn(function() {
      let storage = HomeProvider.getStorage(DATASET_ID);
      yield storage.deleteAll();
      yield storage.save(items);
    }).then(null, e => Cu.reportError("Error saving data to HomeProvider: " + e));
  });
}

function deleteDataset() {
  Task.spawn(function() {
    let storage = HomeProvider.getStorage(DATASET_ID);
    yield storage.deleteAll();
  }).then(null, e => Cu.reportError("Error deleting data from HomeProvider: " + e));
}

function startup(data, reason) {
  Home.panels.register(PANEL_ID, optionsCallback);

  switch(reason) {
    case ADDON_INSTALL:
    case ADDON_ENABLE:
      Home.panels.install(PANEL_ID);
      refreshDataset();
      break;

    case ADDON_UPGRADE:
    case ADDON_DOWNGRADE:
      Home.panels.update(PANEL_ID);
      break;
  }

  // Update data once every hour.
  HomeProvider.addPeriodicSync(DATASET_ID, 3600, refreshDataset);
}

function shutdown(data, reason) {
  if (reason == ADDON_UNINSTALL || reason == ADDON_DISABLE) {
    Home.panels.uninstall(PANEL_ID);
    HomeProvider.removePeriodicSync(DATASET_ID);
    deleteDataset();
  }

  Home.panels.unregister(PANEL_ID);
}

function install(data, reason) {}

function uninstall(data, reason) {}
