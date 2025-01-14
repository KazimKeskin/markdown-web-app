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
                    'content' => file_get_contents($itemPath)
                ];
            }
        }
    }

    return $jsonData;
}

function extractLinks($content) {
    // Regular expression to match Markdown links and WikiLinks
    $pattern = '/\[(.*?)\]\((.*?)\)|\[\[(.*?)(?:\|(.*?))?\]\]/';
    preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

    $links = [];
    foreach ($matches as $match) {
        if (!empty($match[1]) && !empty($match[2])) {
            $text = $match[1];
            $url = $match[2];
            $title = $match[1];
        } elseif (!empty($match[3])) {
            $url = $match[3];

            if (!preg_match('/\.[a-zA-Z0-9]+$/', $url)) {
                $url .= '.md';
            }

            $url = str_replace(' ', '%20', $url);
            $text = $match[4] ?? str_replace('%20', ' ', $url);
            $title = $match[4] ?? preg_replace('/\.md$/', '', str_replace('%20', ' ', $url));
        }
        if (!empty($url)) {
                $links[] = [
                    'text' => $text,
                    'url' => $url,
                    'title' => $title,
                ];
        }
    }

    return $links;
}

function addLinks($jsonData) {
    foreach ($jsonData as &$file) {
        if ($file['type'] !== 'folder') {

          $file['links'] = extractLinks($file['content']);

          foreach ($jsonData as &$otherFile) {
              if ($otherFile['type'] !== 'folder' && $otherFile['id'] !== $file['id']) {
                updateLinks($file, $otherFile); // find the linked file and add data
                addBacklinks($file, $otherFile);
              }
          }
        }
    }

    return $jsonData;
}

function updateLinks(&$file, &$otherFile) {
    foreach ($file['links'] as $key => $val) {
       if ($otherFile['filename'] === $val['url']) {
           $file['links'][$key]['filepath'] = $otherFile['filepath'];
           $file['links'][$key]['id'] = $otherFile['id'];
       }
    }
}

function addBacklinks(&$file, &$otherFile) {
    if (strpos($otherFile['content'], $file['title']) !== false) {
       $file['backlinks'][] = [
           'id' => $otherFile['id'],
           'filepath' => $otherFile['filepath'],
           'title' => $otherFile['title']
       ];
    }
}


?>
