function addTagFilter() {

    const tagFilter = document.createElement('div');
    tagFilter.id = "tagFilter";

    const tagDiv = document.createElement("div");
    tagDiv.id = "tagDiv";
    tagDiv.classList.add('hidden');

    const tagsToggle = document.createElement("button");
    tagsToggle.id = "tagsToggle";
    tagsToggle.textContent = "Tags";

    const tagFilterModeLabel = document.createElement("label");
    tagFilterModeLabel.htmlFor = "tagFilterMode";
    tagFilterModeLabel.textContent = "tagFilterMode";
    const tagFilterMode = document.createElement("select");
    tagFilterMode.id = "tagFilterMode";
    tagFilterMode.innerHTML = `
        <option value="and">Match All Tags</option>
        <option value="or">Match Any Tag</option>
    `;

    const tagFilterSettings = document.createElement("div");
    tagFilterSettings.id = "tagFilterSettings";
    const tagSortDiv = document.createElement("div");
    const tagSortLabel = document.createElement("label");
    tagSortLabel.htmlFor = "tagSort";
    tagSortLabel.textContent = "Selectable Tags First";
    const tagSort = document.createElement("input");
    tagSort.type = "checkbox";
    tagSort.id = "tagSort";
    tagSort.name = "tagSort";
    tagSortDiv.appendChild(tagSort);
    tagSortDiv.appendChild(tagSortLabel);


    const clearSelectedTags = document.createElement("li");
    clearSelectedTags.id = "clearSelectedTags";
    clearSelectedTags.classList.add("disabled-tag");
    clearSelectedTags.textContent = "Clear Selected Tags";
    clearSelectedTags.style.fontStyle = "italic"

    const tagList = document.createElement("ul");
    tagList.id = "tagList";

    tagFilterSettings.appendChild(tagFilterMode);
    tagFilterSettings.appendChild(tagSortDiv);
    tagDiv.appendChild(tagFilterSettings);
    tagDiv.appendChild(clearSelectedTags);
    tagDiv.appendChild(tagList);

    tagFilter.appendChild(tagsToggle);
    tagFilter.appendChild(tagDiv);
    sidebar.appendChild(tagFilter);


    tagsToggle.addEventListener('click', function() {
      tagDiv.classList.toggle('hidden');
    });

    tagSort.addEventListener('change', function() {
      renderTags(filesData);
    });

    tagFilterMode.addEventListener('change', function(e) {
      config.tags.tagFilterMode = e.target.value;
      listFiles(allData, 1)
    });
}


function renderTags(data) {
    
    const allTags = allData.flatMap(file => (Array.isArray(file.tags) ? file.tags : []));
    const uniqueTagNames = Array.from(new Set(allTags.map(tag => tag.name))).sort();

    const filteredTags = getTags(data);

    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';

    uniqueTagNames.forEach(tagName => {
        const tagElement = document.createElement('li');
        tagElement.textContent = `#${tagName}`;

        if (config.tags.selectedTags.includes(tagName)) {
          tagElement.classList.add('active-tag');
        }

        // Disable tag if not part of filteredTags
        if (!filteredTags.includes(tagName) && config.tags.tagFilterMode === 'and' && !config.tags.selectedTags.includes(tagName)) {
            tagElement.classList.add('disabled-tag');
            tagElement.style.pointerEvents = 'none';
        }
        else {
            tagElement.addEventListener('click', () => {
                if (config.tags.selectedTags.includes(tagName)) {
                    config.tags.selectedTags = config.tags.selectedTags.filter(t => t !== tagName); // Remove tag if already selected
                } else {
                    config.tags.selectedTags.push(tagName);
                }
                listFiles(allData, 1);
            });
        }

        tagList.appendChild(tagElement);
    });

    // Enable "Clear Selected Tags" element, if any tags are selected
    if (config.tags.selectedTags.length) {
        document.getElementById('clearSelectedTags').classList.remove('disabled-tag')
        document.getElementById('clearSelectedTags').addEventListener('click', () => {
            config.tags.selectedTags = [];
            listFiles(allData, 1);
            document.getElementById('clearSelectedTags').classList.add('disabled-tag')
        });
        tagDiv.insertBefore(document.getElementById('clearSelectedTags'), tagList);
    }
    if (document.getElementById('tagSort').checked === true) {
      sortTags();
    }
}


function filterDataFromTags(data, tagsOptions) {
  const { tagFilterMode, selectedTags } = tagsOptions;

  // Filter the data based on the selected tags
  const filteredFiles = data.filter(file => {
    if (Array.isArray(file.tags)) {
      if (selectedTags.length === 0) {
        return true; // If no selected tags, include all files
      }
      if (tagFilterMode === 'and') {
        return selectedTags.every(tag => file.tags.some(t => t.name === tag)); // If the file contains all selected tags, include it
      }
      else if (tagFilterMode === 'or') {
        return selectedTags.some(tag => file.tags.some(t => t.name === tag)); // If the file contains any selected tag, include it
      }
    }
    return false; // If file has no tags, don't include it.
  });

  return filteredFiles;
}


function getTags(data) {
  const tags = new Set();

  data.forEach(file => {
    if (
      config.tags.selectedTags.length === 0 || // No selected tags: include all
      (Array.isArray(file.tags) && config.tags.tagFilterMode === 'and' && config.tags.selectedTags.every(tag => file.tags.some(t => t.name === tag))) || // Match all selected tags
      (Array.isArray(file.tags) && config.tags.tagFilterMode === 'or' && config.tags.selectedTags.some(tag => file.tags.some(t => t.name === tag))) // Match any selected tag
    ) {
      if (Array.isArray(file.tags)) {
        file.tags.forEach(tag => tags.add(tag.name));
      }
    }
  });

  return Array.from(tags);
}


function sortTags() {
  const items = Array.from(tagList.children);
    items.sort((a, b) => {
      return b.classList.contains("active-tag") - a.classList.contains("active-tag");
    });
    items.sort((a, b) => {
      return a.classList.contains("disabled-tag") - b.classList.contains("disabled-tag");
    });
    items.forEach(item => tagList.appendChild(item));
}
