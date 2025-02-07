async function updateLinks(section) {
    const links = section.querySelectorAll('a');
    for (const link of links) {
      const path = findFileFromLink(link.getAttribute('href'), allData)
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
        const isInternal = new URL(link.href, window.location.origin).origin === window.location.origin;
        if (isInternal && !(await validateAsset(link.href))) {
          link.replaceWith(document.createTextNode("[[" + link.textContent + "]]") );
        }
      }
  };
}

async function validateAsset(url) {
    try {
        const request = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            request.open('HEAD', url, true);
            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            request.onerror = () => {
                resolve(false);
            };
            request.send();
        });
    } catch (error) {
        return false;
    }
}



function findFileFromLink(href, allData) {
  for (const key in allData) {
    if (allData[key].filepath === href.replace(/%20/g, " ")) {
      return allData[key].filepath;
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

    backlinksDiv.appendChild(backlinkList);
  } else {
    // backlinks.textContent = 'No backlinks found.';
    // backlinks.style.display = 'none'
  }
}


function displayTags(file) {
  const tags = file.tags || [];
  if (tags.length > 0) {
    const tagList = document.createElement('ul');
    tags.forEach(tag => {
      const tagLi = document.createElement('li');
      tagLi.textContent = `#${tag.name}`;
      tagLi.dataset.count= tag.count;
      tagList.appendChild(tagLi);
    });

    tagsDiv.appendChild(tagList);
  } else {
    // tagsDiv.textContent = "No tags found.";
    // tagsDiv.style.display = 'none';
  }
}


function parseLinks(text) {
  return text.replace(/(!?)\[\[([^\]]+)\]\]/g, (match, isEmbedded, content) => {
    const [link, alias] = content.split('|').map(part => part.trim());
    return convertLinkToMarkdown(link, alias, isEmbedded);
  });
}


function convertLinkToMarkdown(link, alias = link, isEmbedded) {
  const formattedLink = ensureFileExtension(link);
  if (isEmbedded) {
      return `![${alias}](${formattedLink.replace(/ /g, "%20")})`;
    }
  else {
    return `[${alias}](${formattedLink.replace(/ /g, "%20")})`;
  }
}


function ensureFileExtension(link) {
  // Add .md file extension if none
  const fileExtensionRegex = /\.[a-zA-Z0-9]+$/;
  return fileExtensionRegex.test(link) ? link : `${link}.md`;
}


function displayLinks(file) {
  const linkedFiles = file.links || [];
  const links = linkedFiles.filter(link => link.type !== 'http');
  const externals = linkedFiles.filter(link => link.type === 'http');

  if (links.length > 0) {
    const linkList = document.createElement('ul');
    links.forEach(link => {
      const linkItem = document.createElement('li');
      const linkAnchor = document.createElement('a');

      linkAnchor.textContent = link.title;
      linkAnchor.href = link.url;
      linkAnchor.dataset.id= link.id;
      linkAnchor.dataset.url = link.filepath;

      linkItem.appendChild(linkAnchor);
      linkList.appendChild(linkItem);
    });

    linksDiv.appendChild(linkList);
  } else {
    // linksDiv.textContent = "No links found.";
    // linksDiv.style.display = 'none'
  }

  if (externals.length > 0) {
    const externalsList = document.createElement('ul');
    externals.forEach(external => {
      const linkItem = document.createElement('li');
      const linkAnchor = document.createElement('a');

      linkAnchor.textContent = external.title;
      linkAnchor.href = external.url;

      linkItem.appendChild(linkAnchor);
      externalsList.appendChild(linkItem);
    });

    externalLinksDiv.prepend(externalsList);
  } else {
    // externalLinksDiv.textContent = "No external links found.";
    // externalLinksDiv.style.display = 'none'
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


async function updateEmbeddedLinks(section) {
  const links = section.querySelectorAll('img');
  for (const link of links) {
    const src = link.getAttribute('src');
    if(!link.alt) {
      link.alt = src
    };
    const fileType = src.split('.').pop().toLowerCase();
    if(['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(fileType)) {

      const audio =  document.createElement('audio');
      audio.controls = true;
      audio.innerHTML = `
                <source src="${src}" type="audio/${fileType}">
                Your browser does not support the audio element.
                `;
      link.parentNode.replaceChild(audio, link)
    }
    else if (['mp4', 'webm', 'ogg'].includes(fileType)) {

      const video =  document.createElement('video');
      video.controls = true;
      video.innerHTML = `
                <source src="${src}" type="video/${fileType}">
                Your browser does not support the video element.
                `;
      link.parentNode.replaceChild(video, link)
    }
    else if (config.includedFiletypes.includes(fileType)) {
      const item = findFileInJSON(src, allData);
      if (item) {
        const render = {
        meta: false,
        backlinks: false,
        links: false,
        tags: false,
        updateLinks: true,
        embeddedLinks: true,
        headings: false
        }

        const mdBlock = document.createElement('md-block');
        addContent(item, mdBlock, render);
        link.parentNode.replaceChild(mdBlock, link);
      }
      else {
        const isInternal = new URL(src, window.location.origin).origin === window.location.origin;
        if (isInternal && !(await validateAsset(src))) {
          link.replaceWith(document.createTextNode("![[" + link.alt + "]]") );
        }
      }
    }
  }
}
