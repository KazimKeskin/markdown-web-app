const fileList = document.getElementById('fileList');
const markdownContent = document.getElementById('markdownContent');
const titleHeading = document.getElementById('heading');
const dateHeading = document.getElementById('date');
const timeHeading = document.getElementById('time');
const backlinkSection = document.getElementById('backlinks');
const linkSection = document.getElementById('links');
const page = document.getElementById('page');
const headingsSection = document.getElementById('headingsSection');


let jsonData;
let notebookLoaded = false;

let codeTypes = ['js', 'php', 'css', 'html'];

window.onload = async () => {
  await load(); // Ensure data is loaded
  window.onhashchange = loadPage; // Attach after data is ready
};


function createNestedList(jsonData, fileList) {
  const ul = document.createElement('ul');
  for (const key in jsonData) {
    const li = document.createElement('li');
    const title = jsonData[key].title;
    li.textContent = title;
    li.id = jsonData[key].filepath;
    li.dataset.dateModified = jsonData[key].dateModified
    if (jsonData[key].filetype === 'folder') {
      li.classList.add('folder');
    }
    else if (jsonData[key].filetype === 'file') {
      li.classList.add('file');
    }
    li.addEventListener('click', () => {
      window.location.hash = li.id;
      const allLiElements = document.getElementById('sidebar').querySelectorAll('li');
      allLiElements.forEach(li => {
        li.classList.remove('active');
      });
      li.classList.add('active');
    });
    ul.appendChild(li);
  }
  fileList.appendChild(ul);
}


async function load() {
  await getData()
  .then(data => {
    jsonData = data;
    notebookLoaded = true;
    createNestedList(jsonData, fileList);
    loadPage();
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
}


async function getData() {
  try {
    const response = await fetch('code/build_JSON.php');

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
