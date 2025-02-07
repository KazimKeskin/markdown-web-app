function loadPage() {
    const hash = window.location.hash.slice(1);
    if (hash) {
      item = findFileInJSON(hash, allData)
      console.log(item)
      if (item === null) {
        return
      }
      else {
        const itemListElement = document.getElementById(item.id)
        if (itemListElement && !itemListElement.classList.contains('active')) {
          itemListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const allLiElements = fileListSection.querySelectorAll('li');
        allLiElements.forEach(el => el.classList.remove('active'));
        if(itemListElement){
          itemListElement.classList.add('active');
        }
        config.activeFile = item.filepath

        renderPage(item);
      }
    }
}


function findFileInJSON(hash, allData) {
  for (const key in allData) {
    if (allData[key].filepath === hash.replace(/%20/g, " ")) {
      return allData[key];
    }
  }
  return null;
}


function renderPage(item) {
  page.scrollTo(0, 0);
  clearPage();
   addContent(item, markdownContent)
    .then(() => {
      if (config.render.meta) addMeta(item);
      updateLinks(markdownContent);
      if (config.render.embeddedLinks) updateEmbeddedLinks(markdownContent);
      if (config.render.backlinks) displayBacklinks(item);
      if (config.render.backlinks) updateLinks(backlinkSection);
      if (config.render.links) displayLinks(item);
      if (config.render.links) updateLinks(linkSection);
      if (config.render.tags) displayTags(item);
      if (config.render.headings) listMarkdownHeadings(markdownContent);
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
  backlinksDiv.innerHTML = "";
  tagsDiv.innerHTML = "";
  headingsSection.innerHTML = "";
  linksDiv.innerHTML = "";
  externalLinksDiv.innerHTML = "";
}


function addMeta(item) {
  titleHeading.innerText = item.title;
  dateHeading.innerText = new Date(item.dateModified * 1000).toLocaleString("en-GB", {  year: 'numeric', month: 'long', day: 'numeric' });
  timeHeading.innerText = new Date(item.dateModified * 1000).toLocaleString("en-GB", {  hour: 'numeric', minute: 'numeric'});
}


function addContent(item, pageContent) {
return new Promise((resolve, reject) => {
    let content = item.content;
    content = parseLinks(content);
    content = wrapYamlFrontMatter(content);
    if (config.codeTypes.includes(item.filetype)) {
      content = content.replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
      pageContent.mdContent = `<pre><code class="language-${item.filetype}">${content}</code></pre>`;
    }
    else {
      pageContent.mdContent = content;
    }

    pageContent.addEventListener('md-render', function() {
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
