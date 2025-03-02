function searchData(data, searchConfig) {
    const { searchQuery, activeProfile } = searchConfig;

    if (searchQuery === "") {
        return data;
    }

    const { caseSensitive, matchDistanceTolerance, searchScope } = searchConfig.profiles[activeProfile];

    const normalizedSearchQuery = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    const resultsMap = new Map();

    for (const file of data) {
        let matchFound = false;

        const normalizedTitle = caseSensitive ? file.title : file.title?.toLowerCase();
        const normalizedValue = caseSensitive ? file.content : file.content?.toLowerCase();

        const checkMatch = (field, fieldName) => {
            if (!field) return null;

            if (matchDistanceTolerance === '0') {
                if (field.includes(normalizedSearchQuery)) {
                    return {
                        isMatch: true,
                        matchDistance: 0, // Exact matches have distance 0
                        matchClass: `${fieldName}-match`,
                        matches: []
                    };
                }
            } else {
                const fuzzyResult = fuzzyMatch(field, normalizedSearchQuery, matchDistanceTolerance);
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
    const queryWords = query.split(/\s+/);
    const phrases = [];

    for (let i = 0; i <= words.length - queryWords.length; i++) {
        phrases.push(words.slice(i, i + queryWords.length).join(" "));
    }

    const matches = [];

    phrases.forEach(phrase => {
        const distance = levenshteinDistance(phrase, query);
        if (distance <= threshold || phrase.includes(query)) {
            matches.push({
                phrase,
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


function addSearchOptions() {
    const searchDiv = document.getElementById('searchDiv');

    const optionsContainer = document.createElement("div");
    optionsContainer.id = "optionsContainer";
    optionsContainer.classList.add("hidden")

    const searchOptionsBtn = document.createElement("button");
    searchOptionsBtn.textContent = "Search Options";
    searchOptionsBtn.id = "searchOptionsBtn";
    searchOptionsBtn.addEventListener("click", () => {
        optionsContainer.classList.toggle("hidden");
    });

    const modeDiv = document.createElement("div");
    modeDiv.id = "modeDiv";

    const searchMode = document.createElement("select");
    searchMode.id = "searchMode";

    searchDiv.appendChild(searchOptionsBtn);
    modeDiv.appendChild(searchMode);
    optionsContainer.appendChild(modeDiv);

    const profileOptions = {};

    // Dynamically add profile options
    Object.keys(config.search.profiles).forEach(profile => {
       const option = document.createElement("option");
       option.value = profile;
       option.textContent = profile
           .replace(/([a-z])([A-Z])/g, "$1 $2")
           .replace(/^./, str => str.toUpperCase());
       searchMode.appendChild(option);

       const profileOptionsDiv = document.createElement("div");
       profileOptionsDiv.id = `${profile}Options`;
       profileOptionsDiv.classList.add("profile-options");
       profileOptionsDiv.classList.add("hidden");

       profileOptionsDiv.innerHTML = `
           <div>
               <label for="${profile}_searchScope">Scope:</label>
               <select id="${profile}_searchScope">
                   <option value="title">Titles Only</option>
                   <option value="content">Content Only</option>
                   <option value="both">Titles and Content</option>
               </select>
           </div>
           <div title="Allowed limit of character changes to be considered a match">
               <label for="${profile}_matchDistanceTolerance">Match Distance:</label>
               <select id="${profile}_matchDistanceTolerance">
                 ${Array.from({ length: 11 }, (_, i) => `<option value="${i}">${i === 0 ? "Exact" : i}</option>`).join("")}
               </select>
               (?)
           </div>
           <div>
               <label for="${profile}_caseSensitive">Match Case:</label>
               <input type="checkbox" id="${profile}_caseSensitive">
           </div>
       `;

       function setSearch(profile) {
           profileOptionsDiv.querySelector(`#${profile}_searchScope`).value = config.search.profiles[profile].searchScope;
           profileOptionsDiv.querySelector(`#${profile}_matchDistanceTolerance`).value = config.search.profiles[profile].matchDistanceTolerance;
           profileOptionsDiv.querySelector(`#${profile}_caseSensitive`).checked = config.search.profiles[profile].caseSensitive;
       }
       setSearch(profile);

       optionsContainer.appendChild(profileOptionsDiv);
       profileOptions[profile] = profileOptionsDiv;
    });
    
    searchMode.value = state.search.activeProfile;
    profileOptions[searchMode.value].classList.remove('hidden');


    searchDiv.appendChild(optionsContainer);

    searchMode.addEventListener('change', function () {
      Object.keys(profileOptions).forEach(profile => {
            profileOptions[profile].classList.add('hidden')
      });
      profileOptions[searchMode.value].classList.remove('hidden');
    });

    Object.keys(profileOptions).forEach(profile => {
      optionsContainer.querySelector(`#${profile}_searchScope`).addEventListener("change", function () {
          config.search.profiles[profile].searchScope = this.value;
      });

      optionsContainer.querySelector(`#${profile}_matchDistanceTolerance`).addEventListener("change", function () {
          config.search.profiles[profile].matchDistanceTolerance = parseInt(this.value, 10);
      });

      optionsContainer.querySelector(`#${profile}_caseSensitive`).addEventListener("change", function () {
          config.search.profiles[profile].caseSensitive = this.checked;
      });
    });
}
