function sortData(data, sortOptions) {
    return [...data].sort((a, b) => {
        const { folderFileOrder, sortBy, sortDirection } = sortOptions;

        // Depth sorting
        const depthA = a.filepath.split('/').length - 1;
        const depthB = b.filepath.split('/').length - 1;
        if (depthA !== depthB && folderFileOrder !== 'agnostic' && folderFileOrder !== 'filesOnly') {
            return depthA - depthB;
        }

        const orderMap = {
            foldersFirst: (b.filetype === 'folder') - (a.filetype === 'folder'),
            filesFirst: (a.filetype === 'folder') - (b.filetype === 'folder'),
        };

        const folderFileComparison = orderMap[folderFileOrder] ?? 0;
        if (folderFileComparison !== 0) return folderFileComparison;

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
