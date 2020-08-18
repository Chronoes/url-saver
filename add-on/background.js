function addActiveTab(url) {
  return browser.storage.local.get({ activeTabs: [] }).then((storedItems) => {
    const activeTabs = new Set(storedItems.activeTabs);
    activeTabs.add(url);
    return browser.storage.local.set({
      activeTabs: Array.from(activeTabs),
    });
  });
}

function removeActiveTab(url) {
  return browser.storage.local.get({ activeTabs: [] }).then((storedItems) => {
    var activeTabs = new Set(storedItems.activeTabs);
    if (activeTabs.delete(url)) {
      return browser.storage.local
        .set({
          activeTabs: Array.from(activeTabs),
        })
        .then(() => true);
    }

    return false;
  });
}

function setButtonActive(tabId) {
  browser.pageAction.setIcon({
    tabId: tabId,
    path: {
      19: 'buttons/diskette-active-x19.png',
      36: 'buttons/diskette-active-x36.png',
    },
  });
}

function setButtonInactive(tabId) {
  browser.pageAction.setIcon({
    tabId: tabId,
    path: {
      19: 'buttons/diskette-x19.png',
      36: 'buttons/diskette-x36.png',
    },
  });
}

// Clear old tabs on start
browser.storage.local.remove('activeTabs');

const port = browser.runtime.connectNative('url_saver');

port.onMessage.addListener((response) => {
  console.debug('Received from url_saver:', response);
  if (response.action === 'check') {
    if (response.found) {
      setButtonActive(response.tabId);
      addActiveTab(response.url);
    }
  } else if (response.action === 'remove') {
    if (response.success) {
      setButtonInactive(response.tabId);
    }
  }
});

browser.pageAction.onClicked.addListener((tab) => {
  removeActiveTab(tab.url).then((exists) => {
    if (exists) {
      port.postMessage({ action: 'remove', url: tab.url, tabId: tab.id });
    } else {
      browser.storage.local.get('selectedType').then((storedItems) => {
        port.postMessage({ action: 'add', type: storedItems.selectedType, url: tab.url });
        setButtonActive(tab.id);
        addActiveTab(tab.url);
      });
    }
  });
});

const allowedUrls = /gelbooru\.com.*id=[0-9]+.*/;

browser.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.status === 'complete' && tab.url && allowedUrls.test(tab.url)) {
    browser.pageAction.show(tabId);
    port.postMessage({ action: 'check', url: tab.url, tabId });
  }
});
