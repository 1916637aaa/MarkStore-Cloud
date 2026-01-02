<?php
// admin.php - 美化版后台管理（风格与前台一致）

session_start();

// ==================== 配置区 ====================
// 修改这里为你自己的数据库信息（和 api.php 保持一致！）
$db_host = 'localhost';
$db_user = 'bookmark_user';              // 你的数据库用户名
$db_pass = '2rYdzYMezWP75rLn';      // 你的数据库密码
$db_name = 'bookmark_db';

// 后台登录密码（建议改复杂一点）
$admin_password = 'admin123';   // 修改后记得记牢

// ================================================

// 登录处理
if (isset($_POST['password'])) {
    if ($_POST['password'] === $admin_password) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $error = '密码错误！';
    }
}

// 登出
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    header('Location: admin.php');
    exit;
}

// 检查登录状态
if (!isset($_SESSION['admin_logged_in'])) {
    // 显示登录页面
    ?>
    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>后台登录 - MarkStore Cloud</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   background: #f8fafc; display: flex; justify-content: center; align-items: center; 
                   height: 100vh; margin: 0; color: #334155; }
            .login-box { background: white; padding: 40px; border-radius: 16px; 
                         box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 90%; max-width: 400px; }
            h1 { text-align: center; color: #2563eb; margin-bottom: 30px; }
            input[type="password"] { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; 
                                     border-radius: 8px; font-size: 16px; margin-bottom: 20px; }
            input[type="password"]:focus { outline: none; border-color: #3b82f6; 
                                           box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
            button { width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; 
                     border-radius: 8px; font-size: 16px; cursor: pointer; transition: background 0.2s; }
            button:hover { background: #2563eb; }
            .error { color: #ef4444; text-align: center; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="login-box">
            <h1>MarkStore Cloud<br>后台管理</h1>
            <?php if (isset($error)) echo "<p class='error'>$error</p>"; ?>
            <form method="post">
                <input type="password" name="password" placeholder="请输入后台密码" required autofocus>
                <button type="submit">登录</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 已登录：连接数据库并显示管理面板
try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        die("数据库连接失败: " . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    die("数据库错误: " . $e->getMessage());
}

// 处理删除或清空用户数据
if (isset($_GET['clear']) && !empty($_GET['clear'])) {
    $key = $conn->real_escape_string($_GET['clear']);
    $conn->query("DELETE FROM bookmarks WHERE user_key = '$key'");
    $conn->query("DELETE FROM categories WHERE user_key = '$key'");
    $msg = "用户 $key 的所有数据已清空";
}

if (isset($_GET['delete_user']) && !empty($_GET['delete_user'])) {
    $key = $conn->real_escape_string($_GET['delete_user']);
    $conn->query("DELETE FROM bookmarks WHERE user_key = '$key'");
    $conn->query("DELETE FROM categories WHERE user_key = '$key'");
    $msg = "用户 $key 已删除";
}
?>

<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>后台管理 - MarkStore Cloud</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               background: #f8fafc; margin: 0; color: #334155; }
        header { background: white; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; 
                 box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; justify-content: space-between; 
                 align-items: center; }
        .logo { font-size: 1.6em; font-weight: 700; color: #2563eb; }
        a { color: #3b82f6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .container { padding: 24px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #1e293b; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; 
                overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        th { background: #f1f5f9; padding: 16px; text-align: left; font-weight: 600; color: #475569; }
        td { padding: 16px; border-top: 1px solid #e2e8f0; }
        tr:hover { background: #f8fafc; }
        .btn { padding: 6px 12px; background: #ef4444; color: white; border-radius: 6px; 
               font-size: 13px; cursor: pointer; }
        .btn:hover { background: #dc2626; }
        .msg { padding: 12px; background: #dcfce7; color: #166534; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); 
                     flex: 1; min-width: 200px; }
        .stat-card strong { font-size: 2em; color: #2563eb; }
    </style>
</head>
<body>
    <header>
        <div class="logo">MarkStore Cloud 后台</div>
        <div><a href="admin.php?logout=1">退出登录</a></div>
    </header>

    <div class="container">
        <?php if (isset($msg)) echo "<div class='msg'>$msg</div>"; ?>

        <h1>数据概览</h1>
        <div class="stats">
            <?php
            $total_users = $conn->query("SELECT COUNT(DISTINCT user_key) AS c FROM bookmarks")->fetch_assoc()['c'];
            $total_bookmarks = $conn->query("SELECT COUNT(*) AS c FROM bookmarks")->fetch_assoc()['c'];
            $total_categories = $conn->query("SELECT COUNT(*) AS c FROM categories")->fetch_assoc()['c'];
            ?>
            <div class="stat-card">
                <p>总用户数</p>
                <strong><?php echo $total_users; ?></strong>
            </div>
            <div class="stat-card">
                <p>总书签数</p>
                <strong><?php echo $total_bookmarks; ?></strong>
            </div>
            <div class="stat-card">
                <p>总分类数</p>
                <strong><?php echo $total_categories; ?></strong>
            </div>
        </div>

        <h1>用户列表（点击清空该用户所有数据）</h1>
        <table>
            <thead>
                <tr>
                    <th>用户密钥 (user_key)</th>
                    <th>书签数量</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $result = $conn->query("SELECT user_key, COUNT(*) AS cnt FROM bookmarks GROUP BY user_key ORDER BY cnt DESC");
                if ($result->num_rows == 0) {
                    echo "<tr><td colspan='3'>暂无用户数据</td></tr>";
                } else {
                    while ($row = $result->fetch_assoc()) {
                        $key = htmlspecialchars($row['user_key']);
                        $count = $row['cnt'];
                        echo "<tr>
                            <td><code>$key</code></td>
                            <td>$count 条</td>
                            <td>
                                <a href='admin.php?clear=$key' class='btn' onclick='return confirm(\"确定清空用户 $key 的所有书签和分类？不可恢复！\")'>清空数据</a>
                            </td>
                          </tr>";
                    }
                }
                ?>
            </tbody>
        </table>
    </div>
</body>
</html>
<?php
$conn->close();
?>