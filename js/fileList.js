const listOptions = {
    listView: 'nested', //'nested' or 'flat'
    folderStates: []
};


function listFiles() {
    fileList.innerHTML = '';

    const list = buildList(jsonData, listOptions);

    fileList.appendChild(list);
}


function buildList(jsonData, listOptions) {
    const fragment = document.createDocumentFragment();
    const folderMap = new Map();

    if (listOptions.listView === 'flat') {
      jsonData.forEach(item => {
        if (item.filetype != 'folder') {
          const li = document.createElement('li');
          li.textContent = item.title || item.filename;
          li.id = item.id;
          li.dataset.id = item.filepath;
          li.dataset.dateModified = item.dateModified || '';
          li.dataset.dateCreated = item.dateCreated || '';
          li.classList.add('file');
          fragment.appendChild(li);
        }
      });
    } else {
      jsonData.forEach(item => {
            addListElement(item, folderMap, fragment);
      });
    }
    const ul = document.createElement('ul');
    ul.appendChild(fragment);
    ul.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.matches('li.folder')) {
        handleFolderClick(target);
      } else if (target && target.matches('li.file')) {
        handleFileClick(target);
      }
    });
    return ul;
}


function addListElement(item, folderMap, fragment) {
  // Create element
  let li;
  let itemAlreadyCreated = false;

  if (folderMap.has(item.filepath)) {
    itemAlreadyCreated = true;
    li = folderMap.get(item.filepath);
  } else {
    li = document.createElement('li');
  }

  li.textContent = item.title || item.filename;
  li.id = item.id;
  li.dataset.id = item.filepath;
  li.dataset.dateModified = item.dateModified || '';
  li.dataset.dateCreated = item.dateCreated || '';
  if (itemAlreadyCreated) {
    return;
  }
  if (item.filetype === 'folder') {
    setAsFolder(li)
    folderMap.set(item.filepath, li); // Save the folder reference in the map
  }
  else {
    li.classList.add('file');
  }

  // Append to parent element
  const pathParts = item.filepath.split('/');

  if (pathParts.length === 1) {
    // Root-level item
    fragment.appendChild(li);
  } else {
    // Nested item
    const parentFolderPath = pathParts.slice(0, -1).join('/');

    // Check if the parent folder exists
    let parentFolderLi = folderMap.get(parentFolderPath);

    if (!parentFolderLi) {
      // If the parent folder doesn't exist, create it
      parentFolderLi = document.createElement('li');
      setFolderLi(parentFolderLi);
      folderMap.set(parentFolderPath, parentFolderLi); // Save the parent folder reference in the map
      fragment.appendChild(parentFolderLi); // Append parent folder to the fragment
    }

    // Append the current item to the parent folder
    parentFolderLi.querySelector('ul').appendChild(li);
  }
}


function handleFolderClick(li) {
  li.classList.toggle('collapsed');
  const isCollapsed = li.classList.contains('collapsed');
  updateFolderState(li.id, isCollapsed);
}


function handleFileClick(li) {
  window.location.hash = li.dataset.id;
  const allLiElements = document.getElementById('sidebar').querySelectorAll('li');
  allLiElements.forEach(el => el.classList.remove('active'));
  li.classList.add('active');
}


function setAsFolder(li) {
  li.classList.add('folder');
  const existingState = listOptions.folderStates.find(item => item.id === li.id);
  if (!existingState || existingState.collapsed) {
    li.classList.add('collapsed');
  }

  const nestedUl = document.createElement('ul');
  li.appendChild(nestedUl);
}


function updateFolderState(id, isCollapsed) {
  const existingState = listOptions.folderStates.find(item => item.id === id);

  if (existingState) {
    existingState.collapsed = isCollapsed;
  } else {
    listOptions.folderStates.push({ id, collapsed: isCollapsed });
  }
}
