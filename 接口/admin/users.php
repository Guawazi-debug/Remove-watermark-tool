<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
requireLogin();

// 处理导出
if (isset($_GET['action']) && $_GET['action'] === 'export') {
    $users = db()->fetchAll("SELECT * FROM users ORDER BY created_at DESC");
    $data = [];
    foreach ($users as $user) {
        $data[] = [
            $user['id'],
            $user['openid'],
            $user['nickname'],
            $user['first_login'],
            $user['last_login'],
            $user['login_count'],
            $user['created_at']
        ];
    }
    exportCSV('用户数据_' . date('Y-m-d'), ['ID', 'OpenID', '昵称', '首次登录', '最后登录', '登录次数', '注册时间'], $data);
}

// 分页
$page = getPageParam();
$pageSize = getPageSizeParam();
$search = getQueryParam('search');
$offset = ($page - 1) * $pageSize;

// 查询条件
$where = "1=1";
$params = [];
if ($search) {
    $where .= " AND (nickname LIKE ? OR openid LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
}

// 获取总数
$total = db()->count('users', $where, $params);
$totalPages = ceil($total / $pageSize);

// 获取用户列表
$users = db()->fetchAll("
    SELECT u.*,
    (SELECT COUNT(*) FROM tool_usage WHERE user_id = u.id) as usage_count
    FROM users u
    WHERE {$where}
    ORDER BY u.last_login DESC
    LIMIT {$pageSize} OFFSET {$offset}
", $params);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>用户管理 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include __DIR__ . '/includes/sidebar.php'; ?>

        <main class="main-content">
            <div class="top-bar">
                <h1 class="page-title">用户管理</h1>
                <div class="top-bar-actions">
                    <a href="?action=export" class="btn btn-secondary">📥 导出数据</a>
                </div>
            </div>

            <!-- 搜索 -->
            <div class="search-box">
                <form style="display: flex; gap: 12px; width: 100%;">
                    <input type="text" name="search" class="search-input" placeholder="搜索昵称或OpenID..." value="<?php echo htmlspecialchars($search); ?>">
                    <button type="submit" class="btn btn-primary">搜索</button>
                </form>
            </div>

            <!-- 用户列表 -->
            <div class="data-card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>用户</th>
                            <th>OpenID</th>
                            <th>使用次数</th>
                            <th>首次登录</th>
                            <th>最后登录</th>
                            <th>登录次数</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <?php if ($user['avatar_url']): ?>
                                    <img src="<?php echo htmlspecialchars($user['avatar_url']); ?>" class="user-avatar" alt="">
                                    <?php else: ?>
                                    <div class="user-avatar" style="background: var(--accent-dark); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">👤</div>
                                    <?php endif; ?>
                                    <span class="user-name"><?php echo htmlspecialchars($user['nickname']); ?></span>
                                </div>
                            </td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 12px;"><?php echo substr($user['openid'], 0, 16) . '...'; ?></td>
                            <td><span class="tag tag-blue"><?php echo $user['usage_count']; ?> 次</span></td>
                            <td><?php echo $user['first_login']; ?></td>
                            <td><?php echo timeAgo($user['last_login']); ?></td>
                            <td><?php echo $user['login_count']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($users)): ?>
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.3);">暂无用户数据</td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>

                <!-- 分页 -->
                <div class="table-footer">
                    <div class="page-size-selector">
                        <span>每页显示</span>
                        <select onchange="location.href='?'+buildUrl({page_size: this.value})">
                            <option value="10" <?php echo $pageSize == 10 ? 'selected' : ''; ?>>10</option>
                            <option value="20" <?php echo $pageSize == 20 ? 'selected' : ''; ?>>20</option>
                            <option value="50" <?php echo $pageSize == 50 ? 'selected' : ''; ?>>50</option>
                            <option value="100" <?php echo $pageSize == 100 ? 'selected' : ''; ?>>100</option>
                        </select>
                        <span>条</span>
                    </div>
                    <?php if ($totalPages > 1): ?>
                    <div class="pagination">
                        <?php if ($page > 1): ?>
                        <a href="?<?php echo http_build_query(array_merge($_GET, ['page' => $page - 1])); ?>">上一页</a>
                        <?php endif; ?>

                        <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
                        <?php if ($i == $page): ?>
                        <span class="current"><?php echo $i; ?></span>
                        <?php else: ?>
                        <a href="?<?php echo http_build_query(array_merge($_GET, ['page' => $i])); ?>"><?php echo $i; ?></a>
                        <?php endif; ?>
                        <?php endfor; ?>

                        <?php if ($page < $totalPages): ?>
                        <a href="?<?php echo http_build_query(array_merge($_GET, ['page' => $page + 1])); ?>">下一页</a>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                    <div class="page-info">共 <?php echo $total; ?> 条记录</div>
                </div>
            </div>
        </main>
    </div>

    <script>
    function buildUrl(params) {
        var url = new URL(window.location.href);
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                url.searchParams.set(key, params[key]);
            }
        }
        url.searchParams.delete('page');
        return url.searchParams.toString();
    }
    </script>
</body>
</html>
