<?php
ini_set('memory_limit', '512M'); // or a higher value if needed
header('Content-Type: application/json');
$directoryPath = '../';
$jsonData = [];
generateJSON($jsonData, $directoryPath);

function generateJSON(&$jsonData, $dir, $depthIndex = 0) {
    $array = ['md', 'html', 'php', 'js', 'css', 'txt']; // you can add more file types. note that html can cause issues

    if ($dir !== './') {
            $dir = rtrim($dir, '/') . '/';  // Ensure the directory path has a trailing '/'
        }
    if (is_dir($dir)) {
        $items = scandir($dir);

        foreach ($items as $item) {
            if (substr($item, 0, 1) === '.') {
                continue;
            }

            $itemPath = $dir . '/' . $item;

            if (is_dir($itemPath)) {
                $jsonData[] = [
                    'id' => uniqid(),
                    'filepath' => $dir . $item,
                    'filename' => $item,
                    'title' => $item,
                    'type' => 'folder',
                    'relativePath' => $dir,
                    'dateModified' => filemtime($itemPath),
                    'depthIndex' => $depthIndex
                ];
                generateFolderStructureJSON($jsonData, $itemPath, $depthIndex + 1);
            } elseif (pathinfo($itemPath, PATHINFO_EXTENSION) === 'md') {
                $jsonData[] = [
                    'id' => uniqid(),
                    'filepath' => $dir  . $item,
                    'filename' => $item,
                    'title' => pathinfo($item, PATHINFO_FILENAME),
                    'type' => 'file',
                    'relativePath' => $dir,
                    'dateCreated' => filectime($itemPath),
                    'dateModified' => filemtime($itemPath),
                    'depthIndex' => $depthIndex,
                    'value' => file_get_contents($itemPath)
                ];
            }
        }
    }
    addLinks($jsonData);
    
    return $jsonData;
}

function parseMarkdownFile($filePath) {
    $content = file_get_contents($filePath);

    // Regular expression to match Markdown links
    $pattern = '/\[(.*?)\]\((.*?)\)/';
    preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

    $links = [];
    foreach ($matches as $match) {
        $text = $match[1];
        $url = $match[2];
        $links[] = ['text' => $text, 'url' => $url];
    }

    return $links;
}

function addLinks($jsonData) {
  foreach ($jsonData as &$file) {
    if (array_key_exists('type', $file)) {
      if ($file['type'] === 'file' && pathinfo($file['filename'], PATHINFO_EXTENSION) === 'md') {
          // Parse the Markdown file and extract links
          $filePath = $file['relativePath'] . $file['filename'];
          $links = parseMarkdownFile($filePath);

          // Add links to the current file
          $file['links'] = $links;

          // Iterate through other files to add backlinks
          foreach ($jsonData as &$otherFile) {
            if (array_key_exists('type', $otherFile)) {

            // print_r( $otherFile);
              if ($otherFile['type'] === 'file' && $otherFile['id'] !== $file['id']) {
                  // Check if the current file is referenced in the other file
                  if (strpos($otherFile['value'], $file['title']) !== false) {
                      // Add the other file as a backlink to the current file
                      $otherFileId = $otherFile['id'];
                      $backlinks = [];
                      $backlinks['id'] = $otherFileId;
                      $backlinks['filepath'] = $otherFile['filepath'];
                      $backlinks['title'] = $otherFile['title'];
                      $file['backlinks'][] = $backlinks;
                  }
                  foreach ($file['links'] as $key => $val) {
                    if ($otherFile['filename'] === $val['url']) {
                      $file['links'][$key]['filepath'] = $otherFile['filepath'];
                      $file['links'][$key]['id'] = $otherFile['id'];
                    }
                  }
              }
          }
      }}
  }}
}
?>
