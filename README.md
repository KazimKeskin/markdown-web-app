# Markdown-Web-App
a self-hosted web application for viewing text files with markdown styling.

## Features
- Markdown styling rendered as HTML along with metadata headings
- File directory list with sort options
- File links and embedded multimedia
- Code blocks with syntax highlighting
- Backlinks, headings and links displays

## Installation
- Place 'markdown-web-app' onto a hosted server running PHP
- Configure server/config.json
  - Edit server/config.json with "baseDirectory" as the route from server/build_JSON.php to the files to be rendered and "baseUrl" as the route from index.html to the files to be rendered. Relative paths can be used but if absolute paths are used, then, "baseDirectory" must be a local filepath and "baseUrl" must be a web URL.
- Open index.html in a browser!
