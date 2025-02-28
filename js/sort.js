function sortData(data, sortOptions) {
    return [...data].sort((a, b) => {

        const { folderFileOrder, sortBy, sortDirection } = sortOptions;

        // Depth sorting
        const depthA = a.filepath.split('/').length - 1;
        const depthB = b.filepath.split('/').length - 1;
        if (depthA !== depthB && folderFileOrder ==="foldersFirst") {
            return depthB - depthA;
        }
        else if (depthA !== depthB && folderFileOrder ==="filesFirst") {
            return depthA - depthB;
        }

        const orderMap = {
            foldersFirst: (b.filetype === 'folder') - (a.filetype === 'folder'),
            filesFirst: (a.filetype === 'folder') - (b.filetype === 'folder'),
        };

        const folderFileComparison = orderMap[folderFileOrder] ?? 0;
        if (folderFileComparison !== 0) return folderFileComparison;

        if (sortBy === "relevance") {
          return
        }

        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        let comparison;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue); // Alphabetical comparison for strings
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue; // Numerical comparison
        } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime(); // Date comparison
        } else {
            comparison = String(aValue).localeCompare(String(bValue)); // Fallback for mixed types
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });
}


function addSortOptions() {
  const sortDiv = document.createElement("div");
  sortDiv.id = "sortDiv";

  const sortOptionsDiv = document.createElement("div");
  sortOptionsDiv.id = "sortOptionsDiv";
  sortOptionsDiv.innerHTML = `

    <div>
      <select id="sortBy">
        <option value="relevance">Relevance</option>
        <option value="title">Filename</option>
        <option value="dateModified">Date Modified</option>
        <option value="dateCreated">Date Created</option>
        <option value="filetype">Filetype</option>
        <option value="filesize">File Size</option>
      </select>
    </div>

    <div>
      <select id="sortDirection">
        <option value="asc">Asc</option>
        <option value="desc">Desc</option>
      </select>
    </div>

    <div>
      <select id="folderFileOrder">
        <option value="foldersFirst">Folders First</option>
        <option value="filesFirst">Files First</option>
        <option value="agnostic">Agnostic</option>
        <option value="filesOnly">Files Only</option>
      </select>
    </div>
    `;
    
  sortDiv.appendChild(sortOptionsDiv);
  fileListSection.before(sortDiv);

  function setSortOptions() {
    document.getElementById('sortBy').value = config.sort.sortBy;
    document.getElementById('sortDirection').value = config.sort.sortDirection;
    document.getElementById('folderFileOrder').value = config.sort.folderFileOrder;
  }
  setSortOptions();

  document.getElementById('sortBy').addEventListener('change', updateSortOption);
  document.getElementById('sortDirection').addEventListener('change', updateSortOption);
  document.getElementById('folderFileOrder').addEventListener('change', updateSortOption);
}


function updateSortOption() {
  config.sort[this.id] = this.value;
  listFiles(filesData, 3);
}
