<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
requireLogin();

// 处理导出
if (isset($_GET['action']) && $_GET['action'] === 'export') {
    $logs = db()->fetchAll("
        SELECT l.*, u.nickname
        FROM login_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.login_time DESC
    ");
    $data = [];
    foreach ($logs as $log) {
        $data[] = [
            $log['id'],
            $log['login_type'] === 'admin' ? '管理员' : ($log['nickname'] ?? '未知'),
            $log['login_type'] === 'admin' ? '管理员' : '用户',
            $log['login_time'],
            $log['ip_address'],
            $log['user_agent']
        ];
    }
    exportCSV('登录日志_' . date('Y-m-d'), ['ID', '用户', '类型', '登录时间', 'IP地址', '浏览器'], $data);
}

// 分页
$page = getPageParam();
$pageSize = getPageSizeParam();
$typeFilter = getQueryParam('type');
$dateFrom = getQueryParam('date_from');
$dateTo = getQueryParam('date_to');
$offset = ($page - 1) * $pageSize;

// 查询条件
$where = "1=1";
$params = [];
if ($typeFilter) {
    $where .= " AND l.login_type = ?";
    $params[] = $typeFilter;
}
if ($dateFrom) {
    $where .= " AND DATE(l.login_time) >= ?";
    $params[] = $dateFrom;
}
if ($dateTo) {
    $where .= " AND DATE(l.login_time) <= ?";
    $params[] = $dateTo;
}

// 获取总数
$total = db()->count("login_logs l", $where, $params);
$totalPages = ceil($total / $pageSize);

// 获取日志
$logs = db()->fetchAll("
    SELECT l.*, u.nickname
    FROM login_logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE {$where}
    ORDER BY l.login_time DESC
    LIMIT {$pageSize} OFFSET {$offset}
", $params);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录日志 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="admin-wrapper">
        <?php include __DIR__ . '/includes/sidebar.php'; ?>

        <main class="main-content">
            <div class="top-bar">
                <h1 class="page-title">登录日志</h1>
                <div class="top-bar-actions">
                    <a href="?action=export" class="btn btn-secondary">📥 导出数据</a>
                </div>
            </div>

            <!-- 筛选 -->
            <div class="search-box">
                <form style="display: flex; gap: 12px; width: 100%; align-items: center;">
                    <select name="type" class="search-input" style="flex: 1;">
                        <option value="">全部类型</option>
                        <option value="admin" <?php echo $typeFilter === 'admin' ? 'selected' : ''; ?>>管理员</option>
                        <option value="user" <?php echo $typeFilter === 'user' ? 'selected' : ''; ?>>用户</option>
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
                            <th>类型</th>
                            <th>登录时间</th>
                            <th>IP地址</th>
                            <th>浏览器</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($logs as $log): ?>
                        <tr>
                            <td style="color: rgba(255,255,255,0.5);">#<?php echo $log['id']; ?></td>
                            <td>
                                <span class="user-name"><?php echo htmlspecialchars($log['login_type'] === 'admin' ? '管理员' : ($log['nickname'] ?? '未知')); ?></span>
                            </td>
                            <td>
                                <?php if ($log['login_type'] === 'admin'): ?>
                                <span class="tag tag-accent">管理员</span>
                                <?php else: ?>
                                <span class="tag tag-blue">用户</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo $log['login_time']; ?></td>
                            <td style="color: rgba(255,255,255,0.5);"><?php echo $log['ip_address']; ?></td>
                            <td style="color: rgba(255,255,255,0.5); font-size: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="<?php echo htmlspecialchars($log['user_agent']); ?>"><?php echo htmlspecialchars(substr($log['user_agent'], 0, 50)); ?>...</td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($logs)): ?>
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.3);">暂无日志数据</td>
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
