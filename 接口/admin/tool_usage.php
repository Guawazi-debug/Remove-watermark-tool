<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
requireLogin();

// 处理导出
if (isset($_GET['action']) && $_GET['action'] === 'export') {
    $usages = db()->fetchAll("
        SELECT u.*, t.name as tool_name, us.nickname
        FROM tool_usage u
        LEFT JOIN tools t ON u.tool_id = t.tool_id
        LEFT JOIN users us ON u.user_id = us.id
        ORDER BY u.used_at DESC
    ");
    $data = [];
    foreach ($usages as $log) {
        $data[] = [
            $log['id'],
            $log['nickname'] ?? '未登录',
            $log['tool_name'] ?? $log['tool_id'],
            $log['used_at'],
            $log['ip_address']
        ];
    }
    exportCSV('使用记录_' . date('Y-m-d'), ['ID', '用户', '工具', '使用时间', 'IP地址'], $data);
}

// 分页
$page = getPageParam();
$pageSize = getPageSizeParam();
$search = getQueryParam('search');
$dateFrom = getQueryParam('date_from');
$dateTo = getQueryParam('date_to');
$offset = ($page - 1) * $pageSize;

// 查询条件
$where = "1=1";
$params = [];
if ($search) {
    $where .= " AND (t.name LIKE ? OR u.tool_id LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
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
$totalSql = "SELECT COUNT(*) as count FROM tool_usage u LEFT JOIN tools t ON u.tool_id = t.tool_id WHERE {$where}";
$total = db()->fetch($totalSql, $params)['count'];
$totalPages = ceil($total / $pageSize);

// 获取使用记录
$usages = db()->fetchAll("
    SELECT u.*, t.name as tool_name, us.nickname, us.avatar_url
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    LEFT JOIN users us ON u.user_id = us.id
    WHERE {$where}
    ORDER BY u.used_at DESC
    LIMIT {$pageSize} OFFSET {$offset}
", $params);

// 工具使用排行（今日）
$today = date('Y-m-d');
$toolRank = db()->fetchAll("
    SELECT t.name, t.tool_id, COUNT(u.id) as count
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    WHERE DATE(u.used_at) = ?
    GROUP BY u.tool_id
    ORDER BY count DESC
    LIMIT 10
", [$today]);

// 分类使用统计
$categoryStats = db()->fetchAll("
    SELECT t.category, COUNT(u.id) as count
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    WHERE DATE(u.used_at) = ?
    GROUP BY t.category
    ORDER BY count DESC
", [$today]);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>工具统计 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
</head>
<body>
    <div class="admin-wrapper">
        <?php include __DIR__ . '/includes/sidebar.php'; ?>

        <main class="main-content">
            <div class="top-bar">
                <h1 class="page-title">工具使用统计</h1>
                <div class="top-bar-actions">
                    <a href="?action=export" class="btn btn-secondary">📥 导出数据</a>
                </div>
            </div>

            <!-- 图表区域 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- 工具使用排行 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">今日工具使用排行</h3>
                    </div>
                    <div id="rankChart" style="height: 300px;"></div>
                </div>

                <!-- 分类使用统计 -->
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">分类使用统计</h3>
                    </div>
                    <div id="categoryChart" style="height: 300px;"></div>
                </div>
            </div>

            <!-- 筛选 -->
            <div class="search-box">
                <form style="display: flex; gap: 12px; width: 100%; align-items: center;">
                    <input type="text" name="search" class="search-input" placeholder="搜索工具名称..." value="<?php echo htmlspecialchars($search); ?>" style="flex: 2;">
                    <input type="date" name="date_from" class="search-input" value="<?php echo $dateFrom; ?>" style="flex: 1;">
                    <span style="color: rgba(255,255,255,0.5);">至</span>
                    <input type="date" name="date_to" class="search-input" value="<?php echo $dateTo; ?>" style="flex: 1;">
                    <button type="submit" class="btn btn-primary">筛选</button>
                </form>
            </div>

            <!-- 使用记录 -->
            <div class="data-card">
                <div class="data-card-header">
                    <h3 class="data-card-title">使用记录</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>用户</th>
                            <th>工具</th>
                            <th>使用时间</th>
                            <th>IP地址</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($usages as $log): ?>
                        <tr>
                            <td>
                                <div class="user-info">
                                    <?php if ($log['avatar_url']): ?>
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
                        <?php if (empty($usages)): ?>
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.3);">暂无数据</td>
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
    // 工具使用排行
    var rankChart = echarts.init(document.getElementById('rankChart'));
    var rankData = <?php echo json_encode($toolRank); ?>;

    rankChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(35, 31, 27, 0.9)',
            borderColor: 'rgba(194, 149, 106, 0.2)',
            textStyle: { color: '#f0ebe5' }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.15)' } },
            axisLabel: { color: 'rgba(194, 149, 106, 0.5)' },
            splitLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.06)' } }
        },
        yAxis: {
            type: 'category',
            data: rankData.map(d => d.name).reverse(),
            axisLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.15)' } },
            axisLabel: { color: 'rgba(194, 149, 106, 0.6)', width: 80, overflow: 'truncate' }
        },
        series: [{
            data: rankData.map(d => d.count).reverse(),
            type: 'bar',
            barWidth: 16,
            itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#a67d55' }, { offset: 0.5, color: '#c2956a' }, { offset: 1, color: '#d4a87a' }] },
                borderRadius: [0, 6, 6, 0]
            }
        }]
    });

    // 分类使用统计
    var categoryChart = echarts.init(document.getElementById('categoryChart'));
    var categoryData = <?php echo json_encode($categoryStats); ?>;
    var colors = ['#c2956a', '#8fad6f', '#d4a853', '#7aab8a', '#c27070', '#8a9bab'];

    categoryChart.setOption({
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(35, 31, 27, 0.9)',
            borderColor: 'rgba(194, 149, 106, 0.2)',
            textStyle: { color: '#f0ebe5' }
        },
        legend: {
            bottom: '5%',
            textStyle: { color: 'rgba(194, 149, 106, 0.6)' },
            itemGap: 16
        },
        series: [{
            type: 'pie',
            radius: ['42%', '72%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 8,
                borderColor: 'rgba(35, 31, 27, 0.8)',
                borderWidth: 3
            },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#f0ebe5' },
                itemStyle: { shadowBlur: 20, shadowColor: 'rgba(194, 149, 106, 0.3)' }
            },
            labelLine: { show: false },
            data: categoryData.map((d, i) => ({ value: d.count, name: d.category || '未分类', itemStyle: { color: colors[i % colors.length] } }))
        }]
    });

    window.addEventListener('resize', function() {
        rankChart.resize();
        categoryChart.resize();
    });

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
