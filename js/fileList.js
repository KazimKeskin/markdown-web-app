function listFiles(data, startStep = 1) {
    filesData = data;

    if (startStep <= 1 && config.tags.tagFilterEnabled) {
        filesData = filterDataFromTags(filesData, config.tags)
    }

    if (startStep <= 2 && config.search.searchEnabled) {
        filesData = searchData(filesData, config.search)
        if (config.tags.tagFilterEnabled) {
          renderTags(filesData);
        }
    }

    if (startStep <= 3 && config.sort.sortEnabled) {
        filesData = sortData(filesData, config.sort)
    }

    if (startStep <= 4) {
        fileListSection.innerHTML = '';
        const list = buildList(filesData);
        list.id = "fileList";
        fileListSection.appendChild(list);
    }
}


function buildList(allData) {
    const fragment = document.createDocumentFragment();

    if (config.sort.folderFileOrder === 'filesOnly') {
        allData.filter(item => item.filetype !== 'folder').forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.title || item.filename;
            li.id = item.id;
            li.dataset.id = item.filepath;
            li.dataset.dateModified = item.dateModified || '';
            li.dataset.dateCreated = item.dateCreated || '';
            li.classList.add('file');
            fragment.appendChild(li);
        });
    }
    else {
        const folderMap = new Map();
        const ulMap = new Map();
        allData.forEach(item => {
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
    
    // Append list element
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
            // Find parent item in allData
            const parentItem = allData.find(data => data.filepath === parentPath);
    
            if (parentItem) {
                // Create parent list element
                addListElement(parentItem, folderMap, ulMap, fragment);
                parentUl = ulMap.get(parentPath);
            } else {
                return;
            }
        }
        if (parentUl) {
          // Append to parent folder ul
          parentUl.appendChild(li);
        }
    }
}


function handleFolderClick(li) {
    li.classList.toggle('collapsed');
    const isCollapsed = li.classList.contains('collapsed');
    updateFolderState(li.dataset.id, isCollapsed);
}


function handleFileClick(li) {
    const allLiElements = document.getElementById('sidebar').querySelectorAll('li');
    allLiElements.forEach(el => el.classList.remove('active'));
    li.classList.add('active');
    window.location.hash = li.dataset.id;
    config.activeFile = li.dataset.id
}


function setAsFolder(li) {
    li.classList.add('folder');
    const existingState = config.folderStates.find(item => item.id === li.id);
    if (!existingState || existingState.collapsed) {
        li.classList.add('collapsed');
    }
    
    const nestedUl = document.createElement('ul');
    li.appendChild(nestedUl);
}


function updateFolderState(id, isCollapsed) {
    const existingState = config.folderStates.find(item => item.id === id);
    
    if (existingState) {
        existingState.collapsed = isCollapsed;
    } else {
        config.folderStates.push({ id, collapsed: isCollapsed });
    }
}
