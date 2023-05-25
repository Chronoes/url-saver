const storedItems = await browser.storage.local.get({
  debug: false,
});

const debugCheck = document.getElementById('debug-check');
debugCheck.checked = storedItems.debug;
