const nativePort = browser.runtime.connectNative('url_saver');

nativePort.onMessage.addListener((response) => {
  console.debug('Received from url_saver:', response);
  if (response.action === 'startup') {
    browser.storage.local.set({ types: response.types });
  }
  if (typeof response.tabId !== 'undefined') {
    browser.tabs.sendMessage(response.tabId, response);
  }
});

browser.runtime.onMessage.addListener((data, sender) => {
  if (data.action) {
    data.tabId = sender.tab.id;
    nativePort.postMessage(data);
  }
});
