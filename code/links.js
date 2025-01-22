function updateLinks(section) {
    const links = section.querySelectorAll('a');
    links.forEach(link => {
      const path = findFileFromLink(link.getAttribute('href'), jsonData)
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
        validateAsset(link);
      }
  });
}

async function validateAsset(link) {
    const url = link.href;
    const isInternal = new URL(url, window.location.origin).origin === window.location.origin;
    try {
        if (isInternal) {
            const request = new XMLHttpRequest();
            request.open('HEAD', url, false);
            request.send();
            if (request.status < 200 || request.status >= 300) {
                link.replaceWith(document.createTextNode("[[" + link.textContent + "]]") );
            }
        }
    } catch (error) {
        if (isInternal) {
            link.replaceWith(document.createTextNode("[[" + link.textContent + "]]") );
        }
    }
}


function findFileFromLink(href, jsonData) {
  for (const key in jsonData) {
    if (jsonData[key].filepath === decodeURIComponent(href)) {
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
    backlinkLink.href = linkedFile.filepath;
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
  return text.replace(/!?\[\[([^\]]+)\]\]/g, (match, content) => {
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


function listMarkdownHeadings(content) {
  const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingsList = document.createElement('ul');
  const listStack = [headingsList]; // Stack to manage nested lists
  let currentDepth = 1; // Tracks the depth of the last heading processed

  if (headings.length > 0) {
    headings.forEach((heading) => {
      const depth = parseInt(heading.tagName.substring(1)); // Get heading depth
      const text = heading.textContent.trim();

      const listItem = document.createElement('li');
      const headingLink = document.createElement('a');
      headingLink.textContent = text;
      headingLink.href = '#' + text.toLowerCase().replace(/\s+/g, '-');
      headingLink.addEventListener('click', function (event) {
        event.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });



      listItem.classList.add(`heading-level-${depth}`);
      listItem.appendChild(headingLink);

      if (depth > currentDepth) {
         const nestedList = document.createElement('ul');
         const parentListItem = listStack[listStack.length - 1].lastElementChild;
        if (parentListItem) {
          parentListItem.appendChild(nestedList);
          listStack.push(nestedList);
        }
          } else if (depth < currentDepth) {
            // Pop the stack until the correct level is reached
            while (depth < currentDepth && listStack.length > 1) {
              listStack.pop();
              currentDepth--;
            }
          }

      listStack[listStack.length - 1].appendChild(listItem);

      currentDepth = depth;
    });

    headingsSection.appendChild(headingsList);
  } else {
    // headingsSection.textContent = 'No headings found';
    // headingsSection.style.display = 'none';
  }
}
