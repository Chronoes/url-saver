let nativeConnected = true;
let nativePort;

function getNativePort() {
  if (nativePort && nativeConnected) {
    return nativePort;
  }
  nativePort = browser.runtime.connectNative('url_saver');
  nativePort.onDisconnect.addListener(() => {
    nativeConnected = false;
  });
  nativePort.onMessage.addListener((response) => {
    console.debug('Received from url_saver:', response);
    if (response.action === 'startup') {
      browser.storage.local.set({ types: response.types });
    }
    if (typeof response.tabId !== 'undefined') {
      browser.tabs.sendMessage(response.tabId, response);
    }
  });

  return nativePort;
}

getNativePort();

browser.runtime.onMessage.addListener((data, sender) => {
  if (data.action) {
    const port = getNativePort();
    data.tabId = sender.tab.id;
    port.postMessage(data);
  }
});
