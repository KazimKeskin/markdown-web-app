function searchData(data, searchConfig) {
    const { searchQuery, profile } = searchConfig;

    if (searchQuery === "") {
        return data;
    }

    const { caseSensitive, matchTolerance, searchScope, sortResults } = searchConfig.profiles[profile];

    const normalizedSearchQuery = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    const resultsMap = new Map();

    for (const file of data) {
        let matchFound = false;

        const normalizedTitle = caseSensitive ? file.title : file.title?.toLowerCase();
        const normalizedValue = caseSensitive ? file.content : file.content?.toLowerCase();

        const checkMatch = (field, fieldName) => {
            if (!field) return null;

            if (matchTolerance === '0') {
                if (field.includes(normalizedSearchQuery)) {
                    return {
                        isMatch: true,
                        matchDistance: 0, // Exact matches have distance 0
                        matchClass: `${fieldName}-match`,
                        matches: []
                    };
                }
            } else {
                const fuzzyResult = fuzzyMatch(field, normalizedSearchQuery, matchTolerance);
                if (fuzzyResult.isMatch) {
                    return {
                        isMatch: true,
                        matchDistance: fuzzyResult.matches.distance,
                        matchClass: `${fieldName}-match`,
                        matches: fuzzyResult.matches
                    };
                }
            }
            return null;
        };

        // Check title match
        if ((searchScope === 'both' || searchScope === 'title') && !matchFound) {
            const titleMatch = checkMatch(normalizedTitle, 'title');
            if (titleMatch?.isMatch) {
                resultsMap.set(file.id, { ...file, ...titleMatch });
                matchFound = true;
            }
        }

        // Check content match
        if ((searchScope === 'both' || searchScope === 'content') && !matchFound) {
            const contentMatch = checkMatch(normalizedValue, 'content');
            if (contentMatch?.isMatch) {
                resultsMap.set(file.id, { ...file, ...contentMatch });
                matchFound = true;
            }
        }
    }

    // Sort results by matchDistance
    return Array.from(resultsMap.values()).sort((a, b) => a.matchDistance - b.matchDistance);
}


function levenshteinDistance(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    // Initialize first column and row
    for (let i = 0; i <= a.length; i++) {
        matrix[i][0] = i;
    }
    for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix based on the Levenshtein algorithm
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,    // Deletion
                matrix[i][j - 1] + 1,    // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    return matrix[a.length][b.length];
}


function fuzzyMatch(text, query, threshold = 3) {
    const words = text.split(/\s+/);
    const matches = [];

    words.forEach(word => {
        const distance = levenshteinDistance(word, query);
        if (distance <= threshold || word.includes(query)) {
            matches.push({
                word,
                distance
            });
        }
    });

    return {
        isMatch: matches.length > 0,
        matches
    };
}

function addSearch() {
    const searchDiv = document.createElement("div");
    searchDiv.id = "searchDiv";

    const form = document.createElement("form");
    form.id = "search";
    form.method = "post";

    const searchInput = document.createElement("input");
    searchInput.name = "query";
    searchInput.id = "searchInput";
    searchInput.placeholder = "Search";
    searchInput.required = true;

    form.appendChild(searchInput);
    searchDiv.appendChild(form);
    sidebar.prepend(searchDiv);


    // Search on input
    searchInput.addEventListener('input', function () {
      config.search.searchQuery = searchInput.value.trim();
      config.search.profile = "onInput";
      listFiles(allData, 1);
    });

    // Search on enter keypress
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          config.search.profile = "onEnterKeypress";
          listFiles(allData, 1)
        }
    });
}
