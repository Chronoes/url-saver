import { Action, isAction, isPayload } from './types';

let nativeConnected = true;
let nativePort: browser.runtime.Port;

function getNativePort() {
  if (nativePort && nativeConnected) {
    return nativePort;
  }
  nativePort = browser.runtime.connectNative('url_saver');
  nativePort.onDisconnect.addListener(() => {
    nativeConnected = false;
  });
  nativePort.onMessage.addListener(async (response) => {
    const storedItems = await browser.storage.local.get('debug');
    if (storedItems.debug) {
      console.debug('Received from url_saver:', response);
    }
    if (isAction(response, Action.Startup)) {
      browser.storage.local.set({ types: response.types });
    }
    if (isPayload(response) && response.tabId) {
      browser.tabs.sendMessage(response.tabId, response);
    }
  });

  return nativePort;
}

getNativePort();

const activeTabs = new Set();

browser.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

browser.runtime.onMessage.addListener((data, sender) => {
  if (data.action) {
    const port = getNativePort();
    data.tabId = sender.tab.id;
    port.postMessage(data);
    activeTabs.add(data.tabId);
  }
});

browser.storage.onChanged.addListener((changes, areaName) => {
  activeTabs.forEach((tabId) => {
    if (tabId) browser.tabs.sendMessage(tabId, { action: 'storage change', changes, areaName });
  });
});
