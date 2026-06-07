<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
requireLogin();

// 获取日期参数
$dateRange = $_GET['range'] ?? 'today';
$date = $_GET['date'] ?? date('Y-m-d');

// 根据日期范围计算日期
switch ($dateRange) {
    case 'yesterday':
        $startDate = date('Y-m-d', strtotime('-1 day'));
        $endDate = $startDate;
        break;
    case 'week':
        $startDate = date('Y-m-d', strtotime('-6 days'));
        $endDate = date('Y-m-d');
        break;
    case 'month':
        $startDate = date('Y-m-d', strtotime('-29 days'));
        $endDate = date('Y-m-d');
        break;
    default: // today
        $startDate = date('Y-m-d');
        $endDate = $startDate;
}

// 指定日期的使用次数
$selectedUsage = db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [$startDate, $endDate]);

// 昨日使用次数（用于对比）
$yesterdayUsage = db()->count('tool_usage', "DATE(used_at) = ?", [date('Y-m-d', strtotime('-1 day'))]);

// 今日使用次数
$todayUsage = db()->count('tool_usage', "DATE(used_at) = ?", [date('Y-m-d')]);

// 今日新增用户
$todayUsers = db()->count('users', "DATE(created_at) = ?", [date('Y-m-d')]);
$yesterdayUsers = db()->count('users', "DATE(created_at) = ?", [date('Y-m-d', strtotime('-1 day'))]);

// 总用户数
$totalUsers = db()->count('users');

// 总使用次数
$totalUsage = db()->count('tool_usage');

// 周使用次数
$weekUsage = db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [
    date('Y-m-d', strtotime('-6 days')),
    date('Y-m-d')
]);

// 上周使用次数（上周一到上周日）
$lastWeekMonday = date('Y-m-d', strtotime('last monday -7 days'));
$lastWeekSunday = date('Y-m-d', strtotime('last sunday -7 days'));
$lastWeekUsage = db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [
    $lastWeekMonday,
    $lastWeekSunday
]);

// 24小时使用趋势（根据选择的日期范围）
$hourlyUsage = db()->fetchAll("
    SELECT HOUR(used_at) as hour, COUNT(*) as count
    FROM tool_usage
    WHERE DATE(used_at) BETWEEN ? AND ?
    GROUP BY HOUR(used_at)
    ORDER BY hour
", [$startDate, $endDate]);

// 每日使用趋势（周/月视图）
$dailyUsage = db()->fetchAll("
    SELECT DATE(used_at) as date, COUNT(*) as count
    FROM tool_usage
    WHERE DATE(used_at) BETWEEN ? AND ?
    GROUP BY DATE(used_at)
    ORDER BY date
", [$startDate, $endDate]);

// 工具使用TOP10
$toolTop10 = db()->fetchAll("
    SELECT t.name, t.tool_id, COUNT(u.id) as usage_count
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    WHERE DATE(u.used_at) BETWEEN ? AND ?
    GROUP BY u.tool_id
    ORDER BY usage_count DESC
    LIMIT 10
", [$startDate, $endDate]);

// 最近使用记录
$recentUsage = db()->fetchAll("
    SELECT u.*, t.name as tool_name, us.nickname, us.avatar_url
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    LEFT JOIN users us ON u.user_id = us.id
    ORDER BY u.used_at DESC
    LIMIT 10
");
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据看板 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        .range-tabs {
            display: flex;
            gap: 8px;
            background: var(--bg-elevated);
            padding: 4px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-subtle);
        }
        .range-tab {
            padding: 8px 16px;
            border-radius: var(--radius-sm);
            font-size: 13px;
            color: var(--text-muted);
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        .range-tab:hover {
            color: var(--text-primary);
            background: rgba(194, 149, 106, 0.08);
        }
        .range-tab.active {
            background: var(--accent);
            color: var(--text-inverse);
            font-weight: 500;
        }
        .stats-extra {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-mini {
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .stat-mini-icon {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            background: var(--accent-glow);
        }
        .stat-mini-info {
            flex: 1;
        }
        .stat-mini-label {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 4px;
        }
        .stat-mini-value {
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
            font-family: var(--font-mono);
        }
        .stat-mini-change {
            font-size: 11px;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <?php include __DIR__ . '/includes/sidebar.php'; ?>

        <main class="main-content">
            <div class="top-bar">
                <div>
                    <h1 class="page-title">数据看板</h1>
                    <p class="page-subtitle">实时监控小程序运营数据</p>
                </div>
                <div class="top-bar-actions">
                    <div class="range-tabs">
                        <a href="?range=today" class="range-tab <?php echo $dateRange === 'today' ? 'active' : ''; ?>">今日</a>
                        <a href="?range=yesterday" class="range-tab <?php echo $dateRange === 'yesterday' ? 'active' : ''; ?>">昨日</a>
                        <a href="?range=week" class="range-tab <?php echo $dateRange === 'week' ? 'active' : ''; ?>">近7天</a>
                        <a href="?range=month" class="range-tab <?php echo $dateRange === 'month' ? 'active' : ''; ?>">近30天</a>
                    </div>
                </div>
            </div>

            <!-- 主要统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-label">
                            <?php
                            $rangeLabels = [
                                'today' => '今日',
                                'yesterday' => '昨日',
                                'week' => '近7天',
                                'month' => '近30天'
                            ];
                            echo ($rangeLabels[$dateRange] ?? '今日') . '使用';
                            ?>
                        </span>
                        <div class="stat-card-icon blue">◎</div>
                    </div>
                    <div class="stat-card-value"><?php echo number_format($selectedUsage); ?></div>
                    <div class="stat-card-change <?php echo $selectedUsage >= $yesterdayUsage ? 'positive' : 'negative'; ?>">
                        <?php echo $selectedUsage >= $yesterdayUsage ? '↑' : '↓'; ?>
                        较昨日 <?php echo $yesterdayUsage > 0 ? abs(round(($selectedUsage - $yesterdayUsage) / $yesterdayUsage * 100)) : 0; ?>%
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-label">今日新增</span>
                        <div class="stat-card-icon green">◉</div>
                    </div>
                    <div class="stat-card-value"><?php echo number_format($todayUsers); ?></div>
                    <div class="stat-card-change <?php echo $todayUsers >= $yesterdayUsers ? 'positive' : 'negative'; ?>">
                        <?php echo $todayUsers >= $yesterdayUsers ? '↑' : '↓'; ?>
                        较昨日 <?php echo $yesterdayUsers > 0 ? abs(round(($todayUsers - $yesterdayUsers) / $yesterdayUsers * 100)) : 0; ?>%
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-label">总用户数</span>
                        <div class="stat-card-icon orange">◈</div>
                    </div>
                    <div class="stat-card-value"><?php echo number_format($totalUsers); ?></div>
                    <div class="stat-card-change neutral">累计注册用户</div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-label">总使用次数</span>
                        <div class="stat-card-icon accent">▣</div>
                    </div>
                    <div class="stat-card-value"><?php echo number_format($totalUsage); ?></div>
                    <div class="stat-card-change neutral">累计使用工具</div>
                </div>
            </div>

            <!-- 附加统计 -->
            <div class="stats-extra">
                <div class="stat-mini">
                    <div class="stat-mini-icon">◇</div>
                    <div class="stat-mini-info">
                        <div class="stat-mini-label">今日使用</div>
                        <div class="stat-mini-value"><?php echo number_format($todayUsage); ?></div>
                        <div class="stat-mini-change <?php echo $todayUsage >= $yesterdayUsage ? 'positive' : 'negative' ?>">
                            较昨日 <?php echo $yesterdayUsage > 0 ? round(($todayUsage - $yesterdayUsage) / $yesterdayUsage * 100) : 0; ?>%
                        </div>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon">◆</div>
                    <div class="stat-mini-info">
                        <div class="stat-mini-label">本周使用</div>
                        <div class="stat-mini-value"><?php echo number_format($weekUsage); ?></div>
                        <div class="stat-mini-change <?php echo $weekUsage >= $lastWeekUsage ? 'positive' : 'negative' ?>">
                            较上周 <?php echo $lastWeekUsage > 0 ? round(($weekUsage - $lastWeekUsage) / $lastWeekUsage * 100) : 0; ?>%
                        </div>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon">◎</div>
                    <div class="stat-mini-info">
                        <div class="stat-mini-label">日均使用</div>
                        <div class="stat-mini-value"><?php echo number_format($totalUsage / $daysSinceLaunch); ?></div>
                        <div class="stat-mini-change neutral">自上线以来</div>
                    </div>
                </div>
            </div>

            <!-- 图表区域 -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <!-- 使用趋势 -->
                <div class="chart-box">
                    <div class="chart-header">
                        <h3 class="chart-title">
                            <?php echo $dateRange === 'today' || $dateRange === 'yesterday' ? '24小时' : '每日'; ?>使用趋势
                        </h3>
                    </div>
                    <div id="trendChart" style="height: 300px;"></div>
                </div>

                <!-- 工具使用TOP10 -->
                <div class="chart-box">
                    <div class="chart-header">
                        <h3 class="chart-title">工具使用TOP10</h3>
                    </div>
                    <div id="topChart" style="height: 300px;"></div>
                </div>
            </div>

            <!-- 最近使用记录 -->
            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title"><span class="card-title-icon"></span>最近使用记录</h3>
                </div>
                <div class="table-wrapper">
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
                            <?php foreach ($recentUsage as $log): ?>
                            <tr>
                                <td>
                                    <div class="user-cell">
                                        <?php if ($log['avatar_url']): ?>
                                        <img src="<?php echo htmlspecialchars($log['avatar_url']); ?>" class="user-avatar" alt="">
                                        <?php else: ?>
                                        <div class="user-avatar-placeholder"><?php echo mb_substr($log['nickname'] ?? '用', 0, 1); ?></div>
                                        <?php endif; ?>
                                        <div>
                                            <div class="user-name"><?php echo htmlspecialchars($log['nickname'] ?? '未登录用户'); ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="tag tag-accent"><?php echo htmlspecialchars($log['tool_name'] ?? $log['tool_id']); ?></span></td>
                                <td><?php echo timeAgo($log['used_at']); ?></td>
                                <td style="color: var(--text-muted); font-family: var(--font-mono); font-size: 13px;"><?php echo $log['ip_address']; ?></td>
                            </tr>
                            <?php endforeach; ?>
                            <?php if (empty($recentUsage)): ?>
                            <tr>
                                <td colspan="4" class="empty-state">暂无数据</td>
                            </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script>
    // 使用趋势图
    var trendChart = echarts.init(document.getElementById('trendChart'));
    var isHourly = <?php echo $dateRange === 'today' || $dateRange === 'yesterday' ? 'true' : 'false'; ?>;
    var hourlyData = <?php echo json_encode($hourlyUsage); ?>;
    var dailyData = <?php echo json_encode($dailyUsage); ?>;

    if (isHourly) {
        var hours = [];
        var values = [];
        for (var i = 0; i < 24; i++) {
            hours.push(i + ':00');
            var found = hourlyData.find(d => d.hour == i);
            values.push(found ? found.count : 0);
        }

        trendChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(35, 31, 27, 0.95)',
                borderColor: 'rgba(194, 149, 106, 0.3)',
                textStyle: { color: '#f0ebe5' }
            },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
            xAxis: {
                type: 'category',
                data: hours,
                axisLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.15)' } },
                axisLabel: { color: 'rgba(194, 149, 106, 0.5)', fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: 'rgba(194, 149, 106, 0.5)' },
                splitLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.06)' } }
            },
            series: [{
                data: values,
                type: 'bar',
                barWidth: '60%',
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#d4a87a' },
                            { offset: 1, color: '#a67d55' }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#e4bc8a' },
                                { offset: 1, color: '#c2956a' }
                            ]
                        }
                    }
                }
            }]
        });
    } else {
        var dates = dailyData.map(d => d.date.substring(5));
        var values = dailyData.map(d => d.count);

        trendChart.setOption({
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(35, 31, 27, 0.95)',
                borderColor: 'rgba(194, 149, 106, 0.3)',
                textStyle: { color: '#f0ebe5' }
            },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.15)' } },
                axisLabel: { color: 'rgba(194, 149, 106, 0.5)', fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: 'rgba(194, 149, 106, 0.5)' },
                splitLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.06)' } }
            },
            series: [{
                data: values,
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { color: '#c2956a', width: 3 },
                itemStyle: { color: '#c2956a', borderColor: '#1a1714', borderWidth: 2 },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(194, 149, 106, 0.25)' },
                            { offset: 1, color: 'rgba(194, 149, 106, 0)' }
                        ]
                    }
                }
            }]
        });
    }

    // TOP10条形图
    var topChart = echarts.init(document.getElementById('topChart'));
    var topData = <?php echo json_encode($toolTop10); ?>;

    topChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(35, 31, 27, 0.95)',
            borderColor: 'rgba(194, 149, 106, 0.3)',
            textStyle: { color: '#f0ebe5' }
        },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: 'rgba(194, 149, 106, 0.4)' },
            splitLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.06)' } }
        },
        yAxis: {
            type: 'category',
            data: topData.map(d => d.name).reverse(),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: 'rgba(194, 149, 106, 0.7)', fontSize: 12 }
        },
        series: [{
            data: topData.map(d => d.usage_count).reverse(),
            type: 'bar',
            barWidth: 14,
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                        { offset: 0, color: '#a67d55' },
                        { offset: 0.5, color: '#c2956a' },
                        { offset: 1, color: '#d4a87a' }
                    ]
                },
                borderRadius: [0, 6, 6, 0]
            },
            label: {
                show: true,
                position: 'right',
                color: 'rgba(194, 149, 106, 0.6)',
                fontSize: 11
            }
        }]
    });

    window.addEventListener('resize', function() {
        trendChart.resize();
        topChart.resize();
    });
    </script>
</body>
</html>
