const fileList = document.getElementById('fileList');
const backlinkSection = document.getElementById('backlinkSection');
const backlinksDiv = document.getElementById('backlinksDiv');
const tagsDiv = document.getElementById('tagsDiv');
const page = document.getElementById('page');
const titleHeading = document.getElementById('heading');
const dateHeading = document.getElementById('date');
const timeHeading = document.getElementById('time');
const markdownContent = document.getElementById('markdownContent');
const headingsSection = document.getElementById('headingsSection');
const linkSection = document.getElementById('linkSection');
const linksDiv = document.getElementById('linksDiv');
const externalLinksDiv = document.getElementById('externalLinksDiv');
const base = document.querySelector('base');

let config = {
  "host": "localhost",
  "appName": "markdown-web-app/",
  "baseDirectory": "../",
  "hiddenDirectories": [],
  "includedFiletypes": ["md", "html", "php", "js", "css", "txt", "json"],
  "addLinks": true,
  "addTags": true,
  "codeTypes": ["js", "php", "css", "html", "json"],
  "activeFile": null,
  "folderStates": [],
  "sort": {
    "folderFileOrder": "agnostic",
    "sortBy": "dateModified",
    "sortOrder": "desc"
  }
}

fetch(`./server/config.json`)
  .then((response) => response.json())
  .then((data) => {
    config = { ...config, ...data };
  })
  .catch((error) => console.error('Error loading config:', error));

base.href = config.baseDirectory.replace(/\.\.\//, " ");

let jsonData;
let notebookLoaded = false;


window.onload = async () => {
  await load();
  window.onhashchange = loadPage;
};


async function load() {
  await getData()
  .then(data => {
    jsonData = data;
    notebookLoaded = true;
    listFiles();
    loadPage();
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
}


async function getData() {
  try {
    base.href = "";
    const response = await fetch(`./server/build_JSON.php`);
    base.href = config.baseDirectory.replace(/\.\.\//, " ");
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return { error: 'Error fetching data' };
  }
}
