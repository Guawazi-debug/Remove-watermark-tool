<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';
requireLogin();

$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

// 基础统计
$stats = [
    'today_usage' => db()->count('tool_usage', "DATE(used_at) = ?", [$today]),
    'yesterday_usage' => db()->count('tool_usage', "DATE(used_at) = ?", [$yesterday]),
    'today_users' => db()->count('users', "DATE(created_at) = ?", [$today]),
    'yesterday_users' => db()->count('users', "DATE(created_at) = ?", [$yesterday]),
    'total_users' => db()->count('users'),
    'total_usage' => db()->count('tool_usage'),
    'week_usage' => db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [date('Y-m-d', strtotime('-6 days')), $today]),
    'last_week_usage' => db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [date('Y-m-d', strtotime('-13 days')), date('Y-m-d', strtotime('-7 days'))]),
];

// 在线用户（24小时内有使用的用户）
$onlineUsers = db()->count('users', "last_login >= ?", [date('Y-m-d H:i:s', strtotime('-24 hours'))]);

// 24小时趋势
$hourlyUsage = db()->fetchAll("
    SELECT HOUR(used_at) as hour, COUNT(*) as count
    FROM tool_usage
    WHERE DATE(used_at) = ?
    GROUP BY HOUR(used_at)
    ORDER BY hour
", [$today]);

// 7天趋势
$weeklyTrend = db()->fetchAll("
    SELECT DATE(used_at) as date, COUNT(*) as count
    FROM tool_usage
    WHERE DATE(used_at) BETWEEN ? AND ?
    GROUP BY DATE(used_at)
    ORDER BY date
", [date('Y-m-d', strtotime('-6 days')), $today]);

// 工具TOP10
$toolTop10 = db()->fetchAll("
    SELECT t.name, COUNT(u.id) as count
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    WHERE DATE(u.used_at) = ?
    GROUP BY u.tool_id
    ORDER BY count DESC
    LIMIT 10
", [$today]);

// 分类统计
$categoryStats = db()->fetchAll("
    SELECT t.category, COUNT(u.id) as count
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    WHERE DATE(u.used_at) = ?
    GROUP BY t.category
    ORDER BY count DESC
", [$today]);

// 最近使用
$recentUsage = db()->fetchAll("
    SELECT u.tool_id, t.name as tool_name, us.nickname, u.used_at
    FROM tool_usage u
    LEFT JOIN tools t ON u.tool_id = t.tool_id
    LEFT JOIN users us ON u.user_id = us.id
    ORDER BY u.used_at DESC
    LIMIT 8
");

// 热门时段
$peakHour = db()->fetch("
    SELECT HOUR(used_at) as hour, COUNT(*) as count
    FROM tool_usage
    WHERE DATE(used_at) = ?
    GROUP BY HOUR(used_at)
    ORDER BY count DESC
    LIMIT 1
", [$today]);

// 平均每日使用（自上线以来）
$firstUsage = db()->fetch("SELECT MIN(used_at) as first_date FROM tool_usage");
$startDate = $firstUsage['first_date'] ?? date('Y-m-d');
$daysSinceLaunch = max(1, (int)((time() - strtotime($startDate)) / 86400));
$dailyAvg = round($stats['total_usage'] / $daysSinceLaunch);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据大屏 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0f1e 0%, #0d1526 50%, #0a0f1e 100%);
            min-height: 100vh;
            font-family: 'Microsoft YaHei', sans-serif;
            color: #fff;
            overflow-x: hidden;
        }

        .screen-header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(180deg, rgba(194, 149, 106, 0.08) 0%, transparent 100%);
            border-bottom: 1px solid rgba(194, 149, 106, 0.15);
        }

        .screen-title {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #d4a87a, #c2956a, #a67d55);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .screen-subtitle {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
            margin-top: 8px;
        }

        .screen-content {
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            grid-template-rows: auto auto;
            gap: 20px;
            max-width: 1920px;
            margin: 0 auto;
        }

        /* 统计卡片 */
        .stat-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .stat-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #c2956a, transparent);
        }

        .stat-box-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            background: rgba(194, 149, 106, 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #c2956a;
            margin: 0 auto 16px;
        }

        .stat-box-value {
            font-size: 42px;
            font-weight: 700;
            background: linear-gradient(135deg, #c2956a, #8fad6f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }

        .stat-box-label {
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }

        .stat-box-change {
            font-size: 12px;
            margin-top: 8px;
        }

        .stat-box-change.up {
            color: #8fad6f;
        }

        .stat-box-change.down {
            color: #c27070;
        }

        /* 图表容器 */
        .chart-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 20px;
            position: relative;
        }

        .chart-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #c2956a, transparent);
        }

        .chart-box-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .chart-box-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(180deg, #c2956a, #a67d55);
            border-radius: 2px;
        }

        /* 最近使用列表 */
        .recent-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .recent-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .recent-item-icon {
            width: 36px;
            height: 36px;
            background: rgba(194, 149, 106, 0.15);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .recent-item-info {
            flex: 1;
        }

        .recent-item-name {
            font-size: 14px;
            color: #fff;
        }

        .recent-item-user {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
        }

        .recent-item-time {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.3);
        }

        /* 装饰动画 */
        .decoration {
            position: fixed;
            pointer-events: none;
            z-index: -1;
        }

        .decoration-circle {
            width: 300px;
            height: 300px;
            border: 1px solid rgba(194, 149, 106, 0.08);
            border-radius: 50%;
            animation: pulse 4s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.1; }
        }

        .back-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.3s;
            z-index: 1000;
        }

        .back-btn:hover {
            background: rgba(59, 130, 246, 0.3);
            border-color: #c2956a;
        }

        /* 工具排行列表 */
        .rank-list {
            list-style: none;
        }

        .rank-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
        }

        .rank-num {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
        }

        .rank-num.top1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; }
        .rank-num.top2 { background: linear-gradient(135deg, #94a3b8, #64748b); color: #000; }
        .rank-num.top3 { background: linear-gradient(135deg, #cd7f32, #b8860b); color: #fff; }
        .rank-num.other { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); }

        .rank-name {
            flex: 1;
            font-size: 14px;
        }

        .rank-count {
            color: #c2956a;
            font-weight: 600;
        }

        .rank-bar {
            width: 100px;
            height: 6px;
            background: rgba(194, 149, 106, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }

        .rank-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #a67d55, #c2956a, #d4a87a);
            border-radius: 3px;
            transition: width 1s ease;
        }
    </style>
</head>
<body>
    <a href="dashboard.php" class="back-btn">← 返回后台</a>

    <!-- 装饰 -->
    <div class="decoration" style="top: -100px; right: -100px;">
        <div class="decoration-circle"></div>
    </div>
    <div class="decoration" style="bottom: -100px; left: -100px;">
        <div class="decoration-circle"></div>
    </div>

    <header class="screen-header">
        <h1 class="screen-title">抹印小栈数据中心</h1>
        <p class="screen-subtitle" id="currentTime"><?php echo date('Y年m月d日 H:i:s'); ?></p>
    </header>

    <div class="screen-content">
        <!-- 左侧：统计卡片 -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="stat-box">
                <div class="stat-box-icon">◎</div>
                <div class="stat-box-value" id="todayUsage"><?php echo number_format($stats['today_usage']); ?></div>
                <div class="stat-box-label">今日使用次数</div>
                <div class="stat-box-change <?php echo $stats['today_usage'] >= $stats['yesterday_usage'] ? 'up' : 'down'; ?>">
                    <?php echo $stats['today_usage'] >= $stats['yesterday_usage'] ? '↑' : '↓'; ?>
                    较昨日 <?php echo $stats['yesterday_usage'] > 0 ? abs(round(($stats['today_usage'] - $stats['yesterday_usage']) / $stats['yesterday_usage'] * 100)) : 0; ?>%
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-box-icon">◉</div>
                <div class="stat-box-value" id="weekUsage"><?php echo number_format($stats['week_usage']); ?></div>
                <div class="stat-box-label">本周使用次数</div>
                <div class="stat-box-change <?php echo $stats['week_usage'] >= $stats['last_week_usage'] ? 'up' : 'down'; ?>">
                    <?php echo $stats['week_usage'] >= $stats['last_week_usage'] ? '↑' : '↓'; ?>
                    较上周 <?php echo $stats['last_week_usage'] > 0 ? abs(round(($stats['week_usage'] - $stats['last_week_usage']) / $stats['last_week_usage'] * 100)) : 0; ?>%
                </div>
            </div>
            <div class="stat-box">
                <div class="stat-box-icon">◈</div>
                <div class="stat-box-value" id="totalUsers"><?php echo number_format($stats['total_users']); ?></div>
                <div class="stat-box-label">总用户数</div>
            </div>
            <div class="stat-box">
                <div class="stat-box-icon">▣</div>
                <div class="stat-box-value" id="totalUsage"><?php echo number_format($stats['total_usage']); ?></div>
                <div class="stat-box-label">总使用次数</div>
            </div>
        </div>

        <!-- 中间：图表 -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="chart-box" style="flex: 1;">
                <div class="chart-box-title">24小时使用趋势</div>
                <div id="trendChart" style="height: 280px;"></div>
            </div>
            <div class="chart-box" style="flex: 1;">
                <div class="chart-box-title">分类使用统计</div>
                <div id="categoryChart" style="height: 280px;"></div>
            </div>
        </div>

        <!-- 右侧：排行和统计 -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- 额外统计 -->
            <div class="stat-box" style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color: rgba(255,255,255,0.5); font-size: 12px;">日均使用</div>
                        <div style="font-size: 24px; font-weight: 700; font-family: var(--font-mono);"><?php echo number_format($dailyAvg); ?></div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: rgba(255,255,255,0.5); font-size: 12px;">高峰时段</div>
                        <div style="font-size: 24px; font-weight: 700; font-family: var(--font-mono);"><?php echo $peakHour ? $peakHour['hour'] . ':00' : '--'; ?></div>
                    </div>
                </div>
            </div>

            <div class="chart-box">
                <div class="chart-box-title">工具使用TOP10</div>
                <ul class="rank-list" id="rankList">
                    <?php $maxCount = $toolTop10[0]['count'] ?? 1; ?>
                    <?php foreach ($toolTop10 as $i => $tool): ?>
                    <li class="rank-item">
                        <span class="rank-num <?php echo $i < 3 ? 'top' . ($i + 1) : 'other'; ?>"><?php echo $i + 1; ?></span>
                        <span class="rank-name"><?php echo htmlspecialchars($tool['name'] ?? '未知'); ?></span>
                        <span class="rank-count"><?php echo $tool['count']; ?></span>
                        <div class="rank-bar">
                            <div class="rank-bar-fill" style="width: <?php echo ($tool['count'] / $maxCount) * 100; ?>%;"></div>
                        </div>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </div>

            <div class="chart-box" style="flex: 1;">
                <div class="chart-box-title">最近使用</div>
                <div class="recent-list" id="recentList">
                    <?php foreach ($recentUsage as $log): ?>
                    <div class="recent-item">
                        <div class="recent-item-icon">◎</div>
                        <div class="recent-item-info">
                            <div class="recent-item-name"><?php echo htmlspecialchars($log['tool_name'] ?? $log['tool_id']); ?></div>
                            <div class="recent-item-user"><?php echo htmlspecialchars($log['nickname'] ?? '未登录用户'); ?></div>
                        </div>
                        <div class="recent-item-time"><?php echo timeAgo($log['used_at']); ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>

    <script>
    // 更新时间
    function updateTime() {
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        var seconds = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('currentTime').textContent = year + '年' + month + '月' + day + '日 ' + hours + ':' + minutes + ':' + seconds;
    }
    setInterval(updateTime, 1000);

    // 24小时趋势图
    var trendChart = echarts.init(document.getElementById('trendChart'));
    var hourlyData = <?php echo json_encode($hourlyUsage); ?>;

    var hours = [];
    var values = [];
    for (var i = 0; i < 24; i++) {
        hours.push(i + ':00');
        var found = hourlyData.find(d => d.hour == i);
        values.push(found ? found.count : 0);
    }

    trendChart.setOption({
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(35, 31, 27, 0.9)', borderColor: 'rgba(194, 149, 106, 0.3)', textStyle: { color: '#f0ebe5' } },
        grid: { left: '5%', right: '5%', bottom: '10%', top: '5%', containLabel: true },
        xAxis: {
            type: 'category',
            data: hours,
            axisLine: { lineStyle: { color: 'rgba(194, 149, 106, 0.15)' } },
            axisLabel: { color: 'rgba(194, 149, 106, 0.5)', fontSize: 10 }
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
            lineStyle: { color: '#c2956a', width: 3, shadowColor: 'rgba(194, 149, 106, 0.4)', shadowBlur: 10 },
            itemStyle: { color: '#c2956a', borderColor: '#1a1714', borderWidth: 2 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(194, 149, 106, 0.35)' },
                        { offset: 1, color: 'rgba(194, 149, 106, 0)' }
                    ]
                }
            }
        }]
    });

    // 分类饼图
    var categoryChart = echarts.init(document.getElementById('categoryChart'));
    var categoryData = <?php echo json_encode($categoryStats); ?>;
    var colors = ['#c2956a', '#8fad6f', '#d4a853', '#7aab8a', '#c27070', '#8a9bab'];

    categoryChart.setOption({
        tooltip: { trigger: 'item', backgroundColor: 'rgba(35, 31, 27, 0.9)', borderColor: 'rgba(194, 149, 106, 0.3)', textStyle: { color: '#f0ebe5' } },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: { color: 'rgba(194, 149, 106, 0.7)' }
        },
        series: [{
            type: 'pie',
            radius: ['45%', '72%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: 'rgba(35, 31, 27, 0.8)', borderWidth: 3 },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#f0ebe5' },
                itemStyle: { shadowBlur: 20, shadowColor: 'rgba(194, 149, 106, 0.3)' }
            },
            data: categoryData.map((d, i) => ({
                value: d.count,
                name: d.category || '未分类',
                itemStyle: { color: colors[i % colors.length] }
            }))
        }]
    });

    // 自适应
    window.addEventListener('resize', function() {
        trendChart.resize();
        categoryChart.resize();
    });

    // 自动刷新数据（每30秒，使用AJAX局部刷新）
    setInterval(function() {
        fetch('api/stats.php?action=dashboard')
            .then(function(response) {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(function(data) {
                if (data.code === 200 && data.data) {
                    // 更新今日使用次数
                    var todayUsageEl = document.getElementById('todayUsage');
                    if (todayUsageEl) {
                        todayUsageEl.textContent = data.data.today_usage || '0';
                    }

                    // 更新本周使用次数
                    var weekUsageEl = document.getElementById('weekUsage');
                    if (weekUsageEl) {
                        weekUsageEl.textContent = data.data.week_usage || '0';
                    }

                    // 更新总用户数
                    var totalUsersEl = document.getElementById('totalUsers');
                    if (totalUsersEl) {
                        totalUsersEl.textContent = data.data.total_users || '0';
                    }

                    // 更新总使用次数
                    var totalUsageEl = document.getElementById('totalUsage');
                    if (totalUsageEl) {
                        totalUsageEl.textContent = data.data.total_usage || '0';
                    }

                    console.log('数据已刷新: ' + new Date().toLocaleTimeString());
                }
            })
            .catch(function(error) {
                console.log('数据刷新失败，将在下次自动重试');
            });
    }, 30000);
    </script>
</body>
</html>
