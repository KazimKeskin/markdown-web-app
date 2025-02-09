<?php
ini_set('memory_limit', '512M'); // or a higher value if needed
header('Content-Type: application/json');

$config = json_decode(file_get_contents('config.json'), true);

$jsonData = generateFolderStructureJSON($jsonData, $config['baseDirectory'], $config);
$config['addLinks'] && $jsonData = addLinks($jsonData, $config);
$config['addTags'] && $jsonData = addTags($jsonData, $config);

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
          if (strpos($item, '.') === 0 || in_array($item, $config['hiddenDirectories'])) {
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
    // Match Markdown links, WikiLinks and plain URLs
    $pattern = '/\[\[(.*?)(?:\|(.*?))?\]\]|\[(.*?)\]\((.+?)\)|(https?:\/\/[^\s]+)/';
    preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

    $links = [];
    foreach ($matches as $match) {
        if (!empty($match[1])) {
          // WikiLink [[url|text]] or [[url]]
          $url = $match[1];

          // If the URL doesn't have an extension, append .md
          if (!preg_match('/\.[a-zA-Z0-9]+$/', $url)) {
              $url .= '.md';
          }

          $url = str_replace(' ', '%20', $url);
          $text = $match[3] ?? str_replace('%20', ' ', $url);
          $title = $match[3] ?? preg_replace('/\.md$/', '', str_replace('%20', ' ', $url));
          $type = 'wiki';

        } elseif (!empty($match[3])) {
          // Markdown link [text](url)
          $text = !empty($match[2]) ? $match[2] : $match[3];
          $url = $match[4];
          $title = !empty($match[2]) ? $match[2] : $match[3];
          $type = 'markdown';

        } elseif (!empty($match[5])) {
            // Plain URL
            $url = $match[5];
            $text = $match[5];
            $title = $match[5];
            $type = 'http';
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
                    'type' => $type,
                    'count' => 1
                ];
            }
        }
    }

    return $links;
}

function addLinks($jsonData, $config) {
    foreach ($jsonData as &$file) {
        if ($file['filetype'] !== 'folder' && !in_array($file['filetype'], $config['codeTypes'])) {
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
    $yamlPattern = '/^tags:\s*(?:-?\s*([\w\s,]+)\s*)+/m';
    if (preg_match($yamlPattern, $content, $yamlMatch)) {
        $yamlTags = preg_split('/[\s,]+/', trim($yamlMatch[1]));
        foreach ($yamlTags as $yamlTag) {
          if (empty($yamlTag)) {
                continue;
            }
            $found = false;
            foreach ($tags as &$tag) {
                if ($tag['name'] === $yamlTag) {
                    $tag['yamlCount']++;
                    $tag['count']++;
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $tags[] = [
                    'name' => $yamlTag,
                    'yamlCount' => 1,
                    'inlineCount' => 0,
                    'count' => 1
                ];
            }
        }
    }

    // Extract inline hashtags
    $hashtagPattern = '/(?<=\s)#(\w+)/';
    if (preg_match_all($hashtagPattern, $content, $hashtagMatches)) {
        $inlineTags = $hashtagMatches[1];
        foreach ($inlineTags as $inlineTag) {
          if (empty($inlineTag)) {
                continue;
            }
            $found = false;
            foreach ($tags as &$tag) {
                if ($tag['name'] === $inlineTag) {
                    $tag['inlineCount']++;
                    $tag['count']++;
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $tags[] = [
                    'name' => $inlineTag,
                    'yamlCount' => 0,
                    'inlineCount' => 1,
                    'count' => 1
                ];
            }
        }
    }

    return $tags;
}

function addTags(&$jsonData, $config) {
    foreach ($jsonData as &$file) {
      if ($file['filetype'] !== 'folder' && !in_array($file['filetype'], $config['codeTypes'])) {
          $file['tags'] = extractTags($file['content']);
      }
    }

    return $jsonData;
}

?>
