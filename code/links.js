function updateLinks(section) {
    const links = section.querySelectorAll('a');
    links.forEach(link => {
      const path = findFileFromLink(link.innerText, jsonData)
      if(path) {
        link.dataset.url = path
        link.href = path
        link.addEventListener('click', function(event) {
          
            event.preventDefault();
    
            let hash = this.dataset.url
            window.location.hash = hash;
          });
      }
      else if (link.href) {
        console.log(link.href)
        const url = new URL(link.href);
        const isExternalLink = !url.hostname.includes('localhost'); // Change "yourdomain.com" to your domain
        if (!isExternalLink && link.href.endsWith(".md")) {
            link.replaceWith(document.createTextNode("[[" + link.innerText + "]]") );
        }
      }
  });
}


function findFileFromLink(href, jsonData) {
  for (const key in jsonData) {
    if (jsonData[key].title == href) {
      return jsonData[key].filepath;
    }
  }
  return null;
}


function displayBacklinks(file) {
  const linkedFiles = file.backlinks || [];
  if (linkedFiles.length > 0) {
    const backlinkList = document.createElement('ul');
    for (const key in linkedFiles) {
    const linkedFile = linkedFiles[key];

    const backlinkItem = document.createElement('li');
    const backlinkLink = document.createElement('a');

    backlinkLink.textContent = linkedFile.title;
    backlinkLink.href = linkedFile.id;
    backlinkLink.dataset.id= linkedFile.id;
    backlinkLink.dataset.url= linkedFile.filepath;

    backlinkItem.appendChild(backlinkLink);
    backlinkList.appendChild(backlinkItem);

    }

    backlinkSection.appendChild(backlinkList);
  } else {
    backlinkSection.textContent = 'No backlinks found.';
  }
}


function parseLinks(text) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
    const [link, alias] = content.split('|').map(part => part.trim());
    return convertLinkToMarkdown(link, alias);
  });
}


function convertLinkToMarkdown(link, alias = link) {
  const formattedLink = ensureFileExtension(link);
  return `[${alias}](${encodeURIComponent(formattedLink)})`;
}


function ensureFileExtension(link) {
  // Add .md file extension if none
  const fileExtensionRegex = /\.[a-zA-Z0-9]+$/;
  return fileExtensionRegex.test(link) ? link : `${link}.md`;
}


function displayLinks(file) {
  const linkedFiles = file.links || [];
  if (linkedFiles.length > 0) {
    const linkList = document.createElement('ul');

    linkedFiles.forEach(linkedFile => {
      console.log(linkedFile);
      const linkItem = document.createElement('li');
      const linkAnchor = document.createElement('a');

      linkAnchor.textContent = linkedFile.title;
      linkAnchor.href = linkedFile.url;
      linkAnchor.dataset.id= linkedFile.id;
      linkAnchor.dataset.url = linkedFile.filepath;

      linkItem.appendChild(linkAnchor);
      linkList.appendChild(linkItem);
    });

    linkSection.appendChild(linkList);
  } else {
    linkSection.textContent = "No links found.";
  }
}


function listMarkdownHeadings(markdownText) {
  const headingRegex = /^(#{1,6})\s+(.*)$/gm;

  let match;
  const headingsList = document.createElement('ul');

  while ((match = headingRegex.exec(markdownText)) !== null) {
    const headingLevel = match[1].length;
    const headingText = match[2];

    const listItem = document.createElement('li');
    const headingLink = document.createElement('a');

    headingLink.textContent = headingText;
    headingLink.href = '#' + headingText.toLowerCase().replace(/\s+/g, '-');

    headingLink.addEventListener('click', function(event) {
      event.preventDefault();
    
      const headings = document.querySelectorAll(`#markdownContent h${headingLevel}`);
    
      const targetHeading = Array.from(headings).find(heading => heading.textContent.trim() === headingText.trim());
    
      if (targetHeading) {
        targetHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        console.warn('Target heading not found:', headingText);
      }
    });
    

    listItem.appendChild(headingLink);
    headingsList.appendChild(listItem);
  }

  headingsSection.appendChild(headingsList);
}
