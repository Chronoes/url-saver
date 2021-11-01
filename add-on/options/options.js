function createRow(type) {
  const row = document.createElement('tr');
  const typeCol = document.createElement('td');
  typeCol.classList.add('type-col');
  typeCol.textContent = type;

  const deleteCol = document.createElement('td');
  deleteCol.classList.add('del-col');
  const deleteButton = document.createElement('button');

  deleteButton.textContent = 'X';
  deleteButton.value = type;
  deleteButton.addEventListener('click', (event) => {
    browser.storage.local.get('types').then((storedItems) => {
      browser.storage.local.set({
        types: storedItems.types.filter((type) => type !== event.target.value),
      });
      row.remove();
    });
  });
  deleteCol.appendChild(deleteButton);

  row.appendChild(typeCol);
  row.appendChild(deleteCol);
  return row;
}

browser.storage.local
  .get({
    types: [],
  })
  .then((storedItems) => {
    const table = document.getElementById('types');
    storedItems.types.forEach((type) => {
      table.appendChild(createRow(type));
    });

    const addType = document.forms['add-type'];
    addType.addEventListener('submit', (event) => {
      const checkedType = addType.querySelector('input[name="type"]');
      if (!storedItems.types.includes(checkedType.value)) {
        storedItems.types.push(checkedType.value);
        event.preventDefault();
        browser.storage.local.set({ types: storedItems.types }).then(() => {
          table.appendChild(createRow(checkedType.value));
        });
      }
    });
  });
