<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
requireLogin();

// 处理导出
if (isset($_GET['action']) && $_GET['action'] === 'export') {
    $logs = db()->fetchAll("
        SELECT u.*, t.name as tool_name, us.nickname
        FROM tool_usage u
        LEFT JOIN tools t ON u.tool_id = t.tool_id
        LEFT JOIN users us ON u.user_id = us.id
        ORDER BY u.used_at DESC
    ");
    $data = [];
    foreach ($logs as $log) {
        $data[] = [
            $log['id'],
            $log['nickname'] ?? '未登录',
            $log['tool_name'] ?? $log['tool_id'],
            $log['used_at'],
            $log['ip_address']
        ];
    }
    exportCSV('使用日志_' . date('Y-m-d'), ['ID', '用户', '工具', '使用时间', 'IP地址'], $data);
}

// 分页
$page = getPageParam();
$pageSize = getPageSizeParam();
$search = getQueryParam('search');
$toolFilter = getQueryParam('tool');
$dateFrom = getQueryParam('date_from');
$dateTo = getQueryParam('date_to');
$offset = ($page - 1) * $pageSize;

// 查询条件
$where = "1=1";
$params = [];
if ($search) {
    $where .= " AND (us.nickname LIKE ?)";
    $params[] = "%{$search}%";
}
if ($toolFilter) {
    $where .= " AND u.tool_id = ?";
    $params[] = $toolFilter;
}
if ($dateFrom) {
    $where .= " AND DATE(u.used_at) >= ?";
    $params[] = $dateFrom;
}
if ($dateTo) {
    $where .= " AND DATE(u.used_at) <= ?";
    $params[] = $dateTo;
}

// 获取总数（使用子查询避免JOIN验证问题）
$totalSql = "SELECT COUNT(*) as count FROM tool_usage u LEFT JOIN tools t ON u.tool_id = t.tool_id LEFT JOIN users us ON u.user_id = us.id WHERE {$where}";
$total = db()->fetch($totalSql, $params)['count'];
$totalPages = ceil($total / $pageSize);

// 获取日志
$logs = db()->fetchAll("
    SELECT u.*, t.name as tool_name, us.nickname, us.avatar_url
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    LEFT JOIN users us ON u.user_id = us.id
    WHERE {$where}
    ORDER BY u.used_at DESC
    LIMIT {$pageSize} OFFSET {$offset}
", $params);

// 获取所有工具（用于筛选）
$tools = db()->fetchAll("SELECT * FROM tools ORDER BY name");
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>使用日志 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include __DIR__ . '/includes/sidebar.php'; ?>

        <main class="main-content">
            <div class="top-bar">
                <h1 class="page-title">用户使用日志</h1>
                <div class="top-bar-actions">
                    <a href="?action=export" class="btn btn-secondary">📥 导出数据</a>
                </div>
            </div>

            <!-- 筛选 -->
            <div class="search-box">
                <form style="display: flex; gap: 12px; width: 100%; align-items: center; flex-wrap: wrap;">
                    <input type="text" name="search" class="search-input" placeholder="搜索用户昵称..." value="<?php echo htmlspecialchars($search); ?>" style="flex: 2; min-width: 200px;">
                    <select name="tool" class="search-input" style="flex: 1; min-width: 150px;">
                        <option value="">全部工具</option>
                        <?php foreach ($tools as $tool): ?>
                        <option value="<?php echo $tool['tool_id']; ?>" <?php echo $toolFilter === $tool['tool_id'] ? 'selected' : ''; ?>><?php echo $tool['name']; ?></option>
                        <?php endforeach; ?>
                    </select>
                    <input type="date" name="date_from" class="search-input" value="<?php echo $dateFrom; ?>" style="flex: 1;">
                    <span style="color: rgba(255,255,255,0.5);">至</span>
                    <input type="date" name="date_to" class="search-input" value="<?php echo $dateTo; ?>" style="flex: 1;">
                    <button type="submit" class="btn btn-primary">筛选</button>
                </form>
            </div>

            <!-- 日志列表 -->
            <div class="data-card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户</th>
                            <th>工具</th>
                            <th>使用时间</th>
                            <th>IP地址</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($logs as $log): ?>
                        <tr>
                            <td style="color: rgba(255,255,255,0.5);">#<?php echo $log['id']; ?></td>
                            <td>
                                <div class="user-info">
                                    <?php if ($log['avatar_url'] && preg_match('#^https?://moyin\.awenz\.cn/#', $log['avatar_url'])): ?>
                                    <img src="<?php echo htmlspecialchars($log['avatar_url']); ?>" class="user-avatar" alt="">
                                    <?php else: ?>
                                    <div class="user-avatar" style="background: var(--accent-dark); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">👤</div>
                                    <?php endif; ?>
                                    <span class="user-name"><?php echo htmlspecialchars($log['nickname'] ?? '未登录用户'); ?></span>
                                </div>
                            </td>
                            <td><span class="tag tag-blue"><?php echo htmlspecialchars($log['tool_name'] ?? $log['tool_id']); ?></span></td>
                            <td><?php echo $log['used_at']; ?></td>
                            <td style="color: rgba(255,255,255,0.5);"><?php echo $log['ip_address']; ?></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($logs)): ?>
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.3);">暂无日志数据</td>
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
