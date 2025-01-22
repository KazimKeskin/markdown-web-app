function loadPage() {
  console.log(jsonData);
    const hash = window.location.hash.slice(1);
    if (hash && notebookLoaded) {
      item = findFileInJSON(hash, jsonData)
      console.log(item)
      if (item === null) {
        return
      }
      else {
        renderPage(item);
      }
    }
}


function findFileInJSON(hash, jsonData) {
  for (const key in jsonData) {
    if (jsonData[key].filepath === hash.replace(/%20/g, " ")) {
      return jsonData[key];
    }
  }
  return null;
}


function renderPage(item) {
  clearPage();
  addMeta(item);
  addContent(item)
    .then(() => {
      updateLinks(backlinkSection);
      updateLinks(linkSection);
      updateLinks(page);
      listMarkdownHeadings(item.content);
    })
    .catch(error => {
      console.error("Error adding content:", error);
    });
}


function clearPage() {
  markdownContent.innerHTML = "";
  titleHeading.innerText = "";
  dateHeading.innerText = "";
  timeHeading.innerText = "";
  backlinkSection.innerHTML = "";
  linkSection.innerHTML = "";
  headingsSection.innerHTML = "";
}


function addMeta(item) {
  titleHeading.innerText = item.title;
  dateHeading.innerText = new Date(item.dateModified * 1000).toLocaleString("en-GB", {  year: 'numeric', month: 'long', day: 'numeric' });
  timeHeading.innerText = new Date(item.dateModified * 1000).toLocaleString("en-GB", {  hour: 'numeric', minute: 'numeric'});
}


function addContent(item) {
  return new Promise((resolve) => {
    let content = item.content;
    content = parseLinks(content);
    content = content.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#39;');
    content = wrapYamlFrontMatter(content);
    if (codeTypes.includes(item.filetype)) {
     markdownContent.mdContent = `<pre><code class="language-${item.filetype}">${content}</code></pre>`;
    }
    else {
     markdownContent.mdContent = content;
    }
    displayBacklinks(item);
    displayLinks(item);
    
    markdownContent.addEventListener('md-render', function() {
      clearTimeout(timeoutId);
      resolve();
    }, { once: true });
    
    timeoutId = setTimeout(() => {
      console.warn("md-render timeout! Resolving anyway.");
      reject(new Error("md-render timeout"));
    }, 500);
  });
}


function wrapYamlFrontMatter(content) {
  return content.replace(/^---([\s\S]*?)---/, (match, yamlContent) => {
    return `<pre class="yaml-front-matter">---\n${yamlContent}\n---</pre>`;
  });
}
