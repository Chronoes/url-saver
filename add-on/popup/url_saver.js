browser.storage.local
  .get({
    types: [],
    selectedType: 'default',
  })
  .then(storedItems => {
    const urlType = document.getElementById('url-type');
    const typeElement = urlType.children[0];
    typeElement.checked =
      storedItems.selectedType === typeElement.children[0].value;

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

    document.getElementById('type-form').addEventListener('submit', () => {
      const checkedType = urlType.querySelector(
        'input[name="url_type"]:checked'
      );
      if (checkedType) {
        browser.storage.local.set({ selectedType: checkedType.value });
      }
    });
  });
