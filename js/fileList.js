function listFiles() {
    fileList.innerHTML = '';

    const list = buildList(jsonData);

    fileList.appendChild(list);
}


function buildList(jsonData) {
    const fragment = document.createDocumentFragment();
    

    if (config.sort.folderFileOrder === 'filesOnly') {
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
    } 
    else {
      const folderMap = new Map();
      const ulMap = new Map();
      jsonData.forEach(item => {
            addListElement(item, folderMap, ulMap, fragment);
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


function addListElement(item, folderMap, ulMap, fragment) {
    if (folderMap.has(item.filepath)) {
        return;
    }
    
    // Create list element
    const li = document.createElement('li');
    li.textContent = item.title || item.filename;
    li.id = item.id;
    li.dataset.id = item.filepath;
    li.dataset.dateModified = item.dateModified || '';
    li.dataset.dateCreated = item.dateCreated || '';

    if (item.filetype === 'folder') {
        li.classList.add('folder');

        if (!li.querySelector('ul')) {
            li.appendChild(document.createElement('ul'));
        }
        const existingState = config.folderStates.find(state => state.id === item.filepath);
        if (!existingState || existingState.collapsed) {
            li.classList.add('collapsed');
        }
        folderMap.set(item.filepath, li);
        ulMap.set(item.filepath, li.querySelector('ul'));
    }
    else {
        li.classList.add('file');
        if (config.activeFile === item.filepath) {
            li.classList.add('active');
        }
    }

    //Append list element
    const pathParts = item.filepath.split('/');
    if (pathParts.length === 1) {
        // Root-level item
        fragment.appendChild(li);
    } 
    else {
        // Nested within parent folder
        const parentPath = pathParts.slice(0, -1).join('/');
        let parentUl = ulMap.get(parentPath);

        if (!parentUl) {
            //Find parent item in jsonData
            const parentItem = jsonData.find(data => data.filepath === parentPath);

            if (parentItem) {
                //Create parent list element
                addListElement(parentItem, folderMap, ulMap, fragment, state);
                parentUl = ulMap.get(parentPath);
            }
            else {
                return;
            }
        }
        if (parentUl) {
          //Append to parent folder ul
          parentUl.appendChild(li);
        }
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
