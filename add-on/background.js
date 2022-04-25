async function addActiveTab(url) {
  const storedItems = await browser.storage.local.get({ activeTabs: [] });
  const activeTabs = new Set(storedItems.activeTabs);
  activeTabs.add(url);
  return await browser.storage.local.set({
    activeTabs: Array.from(activeTabs),
  });
}

async function removeActiveTab(url) {
  const storedItems = await browser.storage.local.get({ activeTabs: [] });
  var activeTabs = new Set(storedItems.activeTabs);
  if (activeTabs.delete(url)) {
    await browser.storage.local.set({
      activeTabs: Array.from(activeTabs),
    });
    return true;
  }
  return false;
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

/** @type {browser.runtime.Port} */
let nativePort;

function initializeNative() {
  nativePort = browser.runtime.connectNative('url_saver');
  nativePort.onDisconnect.addListener((p) => {
    initializeNative();
  });

  nativePort.onMessage.addListener((response) => {
    console.debug('Received from url_saver:', response);
    if (response.action === 'is viewed') {
      browser.tabs.sendMessage(response.tabId, response);
    } else if (response.action === 'is added') {
      if (response.found) {
        setButtonActive(response.tabId);
        addActiveTab(response.url);
      }
    } else if (response.action === 'remove') {
      if (response.success) {
        setButtonInactive(response.tabId);
      }
    } else if (response.action === 'startup') {
      browser.storage.local.set({ types: response.types });
    }
  });
}

initializeNative();

browser.pageAction.onClicked.addListener((tab) => {
  removeActiveTab(tab.url).then((exists) => {
    if (exists) {
      nativePort.postMessage({ action: 'remove', url: tab.url, tabId: tab.id });
    } else {
      browser.storage.local.get(['selectedType', 'seriesToggled']).then((storedItems) => {
        nativePort.postMessage({
          action: 'add',
          type: storedItems.selectedType,
          url: tab.url,
          series: storedItems.seriesToggled,
        });
        setButtonActive(tab.id);
        addActiveTab(tab.url);
      });
    }
  });
});

const allowedUrls = /gelbooru\.com.*(?<!p)id=[0-9]+.*/;

browser.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.status === 'complete' && tab.url && allowedUrls.test(tab.url)) {
    browser.pageAction.show(tabId);
    nativePort.postMessage({ action: 'is added', url: tab.url, tabId });
  }
});

browser.runtime.onMessage.addListener(async (data, sender) => {
  if (data === 'end series') {
    const storedItems = await browser.storage.local.get('selectedType');
    nativePort.postMessage({ action: 'end series', type: storedItems.selectedType });
  } else if (data.action) {
    data.tabId = sender.tab.id;
    nativePort.postMessage(data);
  }
});
