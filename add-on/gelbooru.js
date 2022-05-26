function outlineElement(el) {
  el.style.boxShadow = '0 0 6px 6px #c6ff89';
}

function onClickEvent(event) {
  outlineElement(event.currentTarget);
  browser.runtime.sendMessage({ action: 'view', item: { id: event.currentTarget.id, source: 'gelbooru', page: -1 } });
}

function addOutlinesToThumbnails() {
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
}

const urlTypesId = 'url-types-v3w5am90u8';
const saveButtonId = 'save-button-v3w5am90u8';
const seriesToggleButtonId = 'series-toggle-v3w5am90u8';

function saveButtonText(seriesToggled) {
  return seriesToggled ? 'Save to series' : 'Save';
}

function onSaveButtonClick(event) {
  const btn = event.currentTarget;
  if (btn.classList.contains('btn-remove-v3w5am90u8')) {
    browser.runtime.sendMessage({ action: 'remove', url: location.href });
  } else {
    browser.storage.local.get(['selectedType', 'seriesToggled']).then((storedItems) => {
      browser.runtime.sendMessage({
        action: 'add',
        type: storedItems.selectedType,
        url: location.href,
        series: storedItems.seriesToggled,
      });
    });
  }
}

function changeSelectedType(event) {
  browser.storage.local.set({ selectedType: event.currentTarget.value });
}

function changeSeriesToggleButtons(checked) {
  const btn = document.getElementById(saveButtonId);
  if (!btn.classList.contains('btn-remove-v3w5am90u8')) {
    btn.textContent = saveButtonText(checked);
  }
}

function changeSeriesToggle(event) {
  const checked = event.currentTarget.checked;
  browser.storage.local.set({ seriesToggled: checked }).then(async () => {
    if (!checked) {
      const storedItems = browser.storage.local.get('selectedType');
      browser.runtime.sendMessage({ action: 'end series', type: storedItems.selectedType });
    }
  });
  changeSeriesToggleButtons(checked);
}

function createUrlTypeItem(urlTypesContainer, selectedType) {
  return (item, i) => {
    const checked = selectedType === item || (selectedType === '' && i === 0);
    if (checked && selectedType === '') {
      // Change from default type if it's not set yet
      browser.storage.local.set({ selectedType: item });
    }
    const container = document.createElement('div');
    urlTypesContainer.appendChild(container);

    const inp = document.createElement('input');
    inp.type = 'radio';
    inp.name = 'url_type';
    inp.id = `${urlTypesId}-${item}`;
    inp.value = item;
    inp.checked = checked;
    inp.addEventListener('change', changeSelectedType);
    container.appendChild(inp);
    container.insertAdjacentHTML('beforeend', `<label for="${inp.id}">${item}</label>`);
  };
}

function createButtons(seriesToggled) {
  const buttonsContainer = document.createElement('div');

  const seriesToggleContainer = document.createElement('div');
  buttonsContainer.appendChild(seriesToggleContainer);
  const seriesToggleButton = document.createElement('input');
  seriesToggleButton.type = 'checkbox';
  seriesToggleButton.id = seriesToggleButtonId;
  seriesToggleButton.checked = seriesToggled;
  seriesToggleButton.addEventListener('change', changeSeriesToggle);
  seriesToggleContainer.appendChild(seriesToggleButton);
  seriesToggleContainer.insertAdjacentHTML('beforeend', `<label for=${seriesToggleButton.id}>Add to series</label>`);

  const saveButton = document.createElement('button');
  saveButton.id = saveButtonId;
  saveButton.textContent = saveButtonText(seriesToggled);
  saveButton.addEventListener('click', onSaveButtonClick);
  buttonsContainer.appendChild(saveButton);

  return buttonsContainer;
}

async function addViewControls() {
  const imgContainer = document.querySelector('.image-container');
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'url-saver-container-v3w5am90u8';
  imgContainer.parentElement.insertAdjacentElement('afterbegin', controlsContainer);

  const urlTypesFieldset = document.createElement('fieldset');
  controlsContainer.appendChild(urlTypesFieldset);
  urlTypesFieldset.insertAdjacentHTML('beforeend', '<legend>URL type</legend>');

  const urlTypesContainer = document.createElement('div');
  urlTypesFieldset.appendChild(urlTypesContainer);
  urlTypesContainer.id = urlTypesId;

  const {
    types: urlTypes,
    selectedType,
    seriesToggled,
  } = await browser.storage.local.get({
    types: [],
    selectedType: '',
    seriesToggled: false,
  });
  urlTypes.forEach(createUrlTypeItem(urlTypesContainer, selectedType));

  controlsContainer.appendChild(createButtons(seriesToggled));
}

function addViewPageListeners() {
  browser.runtime.onMessage.addListener(async (data, sender) => {
    if ((data.action === 'is added' && data.found) || data.action === 'add') {
      const btn = document.getElementById(saveButtonId);
      btn.textContent = 'Remove';
      btn.classList.add('btn-remove-v3w5am90u8');
    } else if (data.action === 'remove') {
      const storedItems = await browser.storage.local.get('seriesToggled');
      const btn = document.getElementById(saveButtonId);
      btn.textContent = saveButtonText(storedItems.seriesToggled);
      btn.classList.remove('btn-remove-v3w5am90u8');
    }
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.selectedType) {
        const typeEl = document.getElementById(`${urlTypesId}-${changes.selectedType.newValue}`);
        if (typeEl) {
          typeEl.checked = true;
        }
      }
      if (changes.seriesToggled) {
        document.getElementById(seriesToggleButtonId).checked = changes.seriesToggled.newValue;
        changeSeriesToggleButtons(changes.seriesToggled.newValue);
      }
    }
  });
}

const searchParams = new URLSearchParams(location.search);

if (searchParams.get('page') === 'post') {
  switch (searchParams.get('s')) {
    case 'list':
      addOutlinesToThumbnails();
      break;
    case 'view':
      addViewControls();
      addViewPageListeners();
      browser.runtime.sendMessage({ action: 'is added', url: location.href });
      break;
    default:
      break;
  }
}
