<?php
// api.php
header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $input['action'] ?? '';
$user_key = $_GET['user_key'] ?? $input['user_key'] ?? '';

$servername = "localhost"; // 配置你的数据库
$username = "bookmark_user";
$password = "2rYdzYMezWP75rLn";
$dbname = "bookmark_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) die(json_encode(['success' => false, 'message' => '数据库连接失败']));

function sanitize($str) {
    return htmlspecialchars(strip_tags($str), ENT_QUOTES, 'UTF-8');
}

switch ($action) {
    case 'upload':
        $bookmarks = $input['bookmarks'];
        $categories = $input['categories'];

        // 清空旧数据
        $stmt = $conn->prepare("DELETE FROM bookmarks WHERE user_key = ?");
        $stmt->bind_param("s", $user_key);
        $stmt->execute();
        $stmt = $conn->prepare("DELETE FROM categories WHERE user_key = ?");
        $stmt->bind_param("s", $user_key);
        $stmt->execute();

        // 插入分类
        $stmt = $conn->prepare("INSERT INTO categories (id, user_key, name) VALUES (?, ?, ?)");
        foreach ($categories as $cat) {
            $id = sanitize($cat['id']);
            $name = sanitize($cat['name']);
            $stmt->bind_param("sss", $id, $user_key, $name);
            $stmt->execute();
        }

        // 插入书签
        $stmt = $conn->prepare("INSERT INTO bookmarks (id, user_key, title, url, category_id, tags, add_time, visit_count, favicon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($bookmarks as $b) {
            $id = sanitize($b['id']);
            $title = sanitize($b['title']);
            $url = filter_var($b['url'], FILTER_SANITIZE_URL);
            $category_id = sanitize($b['category_id']);
            $tags = implode(',', array_map('sanitize', $b['tags']));
            $add_time = $b['add_time'];
            $visit_count = $b['visit_count'];
            $favicon = filter_var($b['favicon'], FILTER_SANITIZE_URL);
            $stmt->bind_param("sssssiiis", $id, $user_key, $title, $url, $category_id, $tags, $add_time, $visit_count, $favicon);
            $stmt->execute();
        }
        echo json_encode(['success' => true]);
        break;

    case 'download':
        $result = $conn->query("SELECT * FROM categories WHERE user_key = '$user_key'");
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = ['id' => $row['id'], 'name' => $row['name']];
        }

        $result = $conn->query("SELECT * FROM bookmarks WHERE user_key = '$user_key'");
        $bookmarks = [];
        while ($row = $result->fetch_assoc()) {
            $bookmarks[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'url' => $row['url'],
                'category_id' => $row['category_id'],
                'tags' => explode(',', $row['tags']),
                'add_time' => (int)$row['add_time'],
                'visit_count' => (int)$row['visit_count'],
                'favicon' => $row['favicon']
            ];
        }
        echo json_encode(['success' => true, 'categories' => $categories, 'bookmarks' => $bookmarks]);
        break;

    case 'clear':
        $stmt = $conn->prepare("DELETE FROM bookmarks WHERE user_key = ?");
        $stmt->bind_param("s", $user_key);
        $stmt->execute();
        $stmt = $conn->prepare("DELETE FROM categories WHERE user_key = ?");
        $stmt->bind_param("s", $user_key);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => '无效操作']);
}

$conn->close();
?>