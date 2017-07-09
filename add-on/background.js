const port = browser.runtime.connectNative('url_saver');

port.onMessage.addListener(response => {
  console.log('Received: ' + response);
});

browser.pageAction.onClicked.addListener(tab => {
  browser.storage.local.get('selectedType').then(storedItems => {
    port.postMessage({ type: storedItems.selectedType, url: tab.url });

    browser.pageAction.setIcon({
      tabId: tab.id,
      path: {
        19: 'buttons/diskette-active-x19.png',
        36: 'buttons/diskette-active-x36.png',
      },
    });
  });
});

const allowedUrls = /gelbooru\.com.*id=[0-9]+.*/;

browser.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (tab.url && tab.url.match(allowedUrls)) {
    browser.pageAction.show(tabId);
  }
});
