<?php
ini_set('memory_limit', '512M'); // or a higher value if needed
header('Content-Type: application/json');

$directoryPath = '../';
$jsonData = generateFolderStructureJSON($jsonData, $directoryPath);
$jsonData = addLinks($jsonData);
echo json_encode($jsonData);

function generateFolderStructureJSON(&$jsonData, $dir, $depthIndex = 0) {
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
            } elseif (in_array(pathinfo($itemPath, PATHINFO_EXTENSION), $array)) {
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

    return $jsonData;
}

function parseMarkdownFile($filePath) {
    $content = file_get_contents($filePath);

    // Regular expression to match Markdown links and WikiLinks
    $pattern = '/\[(.*?)\]\((.*?)\)|\[\[(.*?)(?:\|(.*?))?\]\]/';
    preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

    $links = [];
    foreach ($matches as $match) {
        if (!empty($match[1]) && !empty($match[2])) {
            // Markdown link
            $text = $match[1];
            $url = $match[2];
            $title = $match[1];
        } elseif (!empty($match[3])) {
            // WikiLink
            $url = $match[3];
            
            // Ensure the link has a file extension
            if (!preg_match('/\.[a-zA-Z0-9]+$/', $url)) {
                $url .= '.md'; // Append .md if no extension exists
            }
            
            // Encode spaces in the URL
            $url = str_replace(' ', '%20', $url);
    
            // Use alias if available, otherwise use the processed link itself
            $text = $match[4] ?? str_replace('%20', ' ', $url); // Decode spaces for alias display
            $title = $match[4] ?? preg_replace('/\.md$/', '', str_replace('%20', ' ', $url));

        }
    
        $links[] = ['text' => $text, 'url' => $url, 'title' => $title];
    }    

    return $links;
}

function addLinks($jsonData) {
  foreach ($jsonData as &$file) {
    if (array_key_exists('type', $file)) {
      if ($file['type'] === 'file' && pathinfo($file['filename'], PATHINFO_EXTENSION) === 'md') {
          // Parse the Markdown file and extract links
          $filePath = $file['filepath'];
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
                      $backlink = [];
                      $backlink['id'] = $otherFile['id'];
                      $backlink['filepath'] = $otherFile['filepath'];
                      $backlink['title'] = $otherFile['title'];
                      $file['backlinks'][] = $backlink;
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

  return $jsonData;
}
?>
