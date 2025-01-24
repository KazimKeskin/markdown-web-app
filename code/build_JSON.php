<?php
ini_set('memory_limit', '512M'); // or a higher value if needed
header('Content-Type: application/json');

$config = json_decode(file_get_contents('config.json'), true);

$jsonData = generateFolderStructureJSON($jsonData, $config['baseDirectory'], $config);
$config['addLinks'] && $jsonData = addLinks($jsonData);
$config['addTags'] && $jsonData = addTags($jsonData);

echo json_encode($jsonData);

function is_dir_empty($dir) {
    $items = scandir($dir);
    return count($items) <= 2;
}

function generateFolderStructureJSON(&$jsonData, $dir, $config, $depthIndex = 0) {
    $dir = rtrim($dir, '/') . '/';

    if (is_dir($dir)) {

      $items = scandir($dir);
      foreach ($items as $item) {

          //ignore hidden directories
          if ($item === '.' || $item === '..' || in_array($item, $config['hiddenDirectories'])) {
              continue;
          }

          $itemPath = $dir . $item;
          $relativePath = ltrim(str_replace(rtrim($config['baseDirectory'], '/') . '/', '', $itemPath), '/');

          if (is_dir($itemPath)) {

                  $jsonData[] = [
                      'id' => uniqid(),
                      'filepath' => str_replace('\\', '/', $relativePath),
                      'filename' => $item,
                      'title' => $item,
                      'filetype' => 'folder',
                      'dateCreated' => filectime($itemPath),
                      'dateModified' => filemtime($itemPath),
                      'content' => null
                  ];

                  generateFolderStructureJSON($jsonData, $itemPath, $config, $depthIndex + 1);
          }
          elseif (in_array(pathinfo($itemPath, PATHINFO_EXTENSION), $config['includedFiletypes'])) {

                  $jsonData[] = [
                      'id' => uniqid(),
                      'filepath' => str_replace('\\', '/', $relativePath),
                      'filename' => $item,
                      'title' => pathinfo($item, PATHINFO_FILENAME),
                      'filetype' => pathinfo($item, PATHINFO_EXTENSION),
                      'dateCreated' => filectime($itemPath),
                      'dateModified' => filemtime($itemPath),
                      'content' => file_get_contents($itemPath)
                  ];
          }
      }
    }

    return $jsonData;
}

function extractLinks($content) {
    $pattern = '/\[(.*?)\]\((.*?)\)|\[\[(.*?)(?:\|(.*?))?\]\]/'; // Match Markdown links and WikiLinks
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
            $found = false;

            foreach ($links as &$link) {
                if ($link['url'] === $url) {
                    $link['count'] = ($link['count'] ?? 0) + 1;
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $links[] = [
                    'text' => $text,
                    'url' => $url,
                    'title' => $title,
                    'count' => 1
                ];
            }
        }
    }

    return $links;
}

function addLinks($jsonData) {
    foreach ($jsonData as &$file) {
        if ($file['filetype'] !== 'folder') {
          $file['links'] = extractLinks($file['content']);

          foreach ($jsonData as &$otherFile) {
              if ($otherFile['filetype'] !== 'folder' && $otherFile['id'] !== $file['id']) {
                updateLinks($file, $otherFile);
              }
          }
        }
    }

    return $jsonData;
}

function updateLinks(&$file, &$otherFile) {
    foreach ($file['links'] as $key => $val) {
       if ($otherFile['filepath'] === str_replace('%20', ' ', $val['url'])) {
           $file['links'][$key]['filepath'] = $otherFile['filepath'];
           $file['links'][$key]['id'] = $otherFile['id'];

           $otherFile['backlinks'][] = [
               'id' => $file['id'],
               'filepath' => $file['filepath'],
               'title' => $file['title'],
               'count' => $file['links'][$key]['count']
           ];
       }
    }
}

function extractTags($content) {
    $tags = [];

    // Extract YAML frontmatter tags
    $yamlPattern = '/^tags:\s*(.+)$/m';
    if (preg_match($yamlPattern, $content, $yamlMatch)) {
        $yamlTags = preg_split('/[\s,]+/', trim($yamlMatch[1]));
        $tags = array_merge($tags, $yamlTags);
    }

    // Extract inline hashtags
    $hashtagPattern = '/#(\w+)/';
    if (preg_match_all($hashtagPattern, $content, $hashtagMatches)) {
        $inlineTags = $hashtagMatches[1];
        $tags = array_merge($tags, $inlineTags);
    }

    return $tags;
}

function addTags(&$jsonData) {
    foreach ($jsonData as &$file) {
      if ($file['filetype'] !== 'folder') {
          $file['tags'] = extractTags($file['content']);
      }
    }

    return $jsonData;
}

?>
