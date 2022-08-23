const source = 'exhentai';

function getIdFromUrl(url) {
  return url.replace(location.origin, '').replace(/^\//, '').replace(/\/$/, '');
}

function outlineElement(el) {
  el.style.boxShadow = '0 0 6px 6px #c6ff89';
}

function onClickEvent(event) {
  outlineElement(event.currentTarget);
  browser.runtime.sendMessage({ action: 'view', item: { id: event.currentTarget.id, source, page: -1 } });
}

function addOutlinesToThumbnails() {
  const thumbnailItems = document.querySelectorAll('.gl1e a');
  if (thumbnailItems.length > 0) {
    browser.runtime.onMessage.addListener((data, sender) => {
      if (data.action === 'is viewed' && data.source === source) {
        data.viewed.forEach((id) => {
          const el = document.querySelector(`a[href$="${id}/"]`);
          if (el) outlineElement(el);
        });
      }
    });

    const ids = [];
    thumbnailItems.forEach((el) => {
      ids.push(getIdFromUrl(el.href));
      el.addEventListener('mousedown', onClickEvent);
    });

    browser.runtime.sendMessage({ action: 'is viewed', source, ids });
  }
}
