function updateUrls() {
    const links = document.querySelectorAll('a');
    // Attach event listener to each link
    links.forEach(link => {
      const path = findFileFromLink(link.getAttribute("href"), jsonData)
      link.href = path
      link.addEventListener('click', function(event) {
        const url = new URL(this.href);
        const isExternalLink = !url.hostname.includes('localhost'); // Change "localhost" to your domain

        if (isExternalLink) {
          // Allow default behavior for external links
          return;
        }
        event.preventDefault(); // Prevent default link behavior

        // let hash = this.getAttribute("href");
        let hash = this.dataset.url
        window.location.hash = hash;
      });
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
    // backlinkSection.textContent = 'No backlinks found.';
  }
}
