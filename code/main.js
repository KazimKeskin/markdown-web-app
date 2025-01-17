const fileList = document.getElementById('fileList');
const backlinkSection = document.getElementById('backlinks');
const page = document.getElementById('page');
const titleHeading = document.getElementById('heading');
const dateHeading = document.getElementById('date');
const timeHeading = document.getElementById('time');
const markdownContent = document.getElementById('markdownContent');
const headingsSection = document.getElementById('headingsSection');
const linkSection = document.getElementById('links');


let jsonData;
let notebookLoaded = false;

let codeTypes = ['js', 'php', 'css', 'html'];

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
