browser.storage.local
  .get({
    types: [],
    selectedType: 'default',
  })
  .then(storedItems => {
    const urlType = document.getElementById('url-type');
    const typeElement = urlType.firstElementChild;
    typeElement.firstElementChild.checked = storedItems.selectedType === typeElement.firstElementChild.value;

    storedItems.types.forEach((type, i) => {
      const radioItem = typeElement.cloneNode(true);
      const input = radioItem.children[0];
      const label = radioItem.children[1];
      label.textContent = type;
      input.id = `url_type_${i + 2}`;
      label.htmlFor = input.id;
      input.value = type;
      input.checked = storedItems.selectedType === type;
      urlType.appendChild(radioItem);
    });

    urlType.querySelectorAll('.radioItem input').forEach(radio => {
      radio.addEventListener('change', event => {
        if (event.target.checked) {
          browser.storage.local.set({ selectedType: event.target.value });
        }
      });
    });
  });
