function outlineElement(el) {
  el.style.boxShadow = '0 0 6px 6px #c6ff89';
}

function onClickEvent(event) {
  outlineElement(event.currentTarget);
  browser.runtime.sendMessage({ action: 'view', item: { id: event.currentTarget.id, source: 'gelbooru', page: -1 } });
}

const thumbnailItems = document.querySelectorAll('.thumbnail-preview a');
if (thumbnailItems.length > 0) {
  browser.runtime.onMessage.addListener((data, sender) => {
    if (data.action === 'is viewed' && data.source === 'gelbooru') {
      data.viewed.forEach((id) => {
        const el = document.getElementById(id);
        if (el) outlineElement(el);
      });
    }
  });

  const ids = [];
  document.querySelectorAll('.thumbnail-preview a').forEach((el) => {
    ids.push(el.id);
    el.addEventListener('mousedown', onClickEvent);
  });

  browser.runtime.sendMessage({ action: 'is viewed', source: 'gelbooru', ids });
}
