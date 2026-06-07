<?php
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$baseUrl = 'https://moyin.awenz.cn/admin';
?>
<aside class="sidebar">
    <div class="sidebar-header">
        <a href="dashboard.php" class="sidebar-logo">
            <div class="sidebar-logo-icon">
                <img src="<?php echo $baseUrl; ?>/logo.png" alt="Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='⚡';">
            </div>
            <div>
                <span class="sidebar-logo-text">抹印小栈</span>
                <span class="sidebar-logo-sub">管理后台</span>
            </div>
        </a>
    </div>

    <nav class="sidebar-menu">
        <div class="menu-section">概览</div>
        <a href="dashboard.php" class="menu-item <?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">
            <span class="menu-icon">◈</span>
            <span>数据看板</span>
        </a>

        <div class="menu-section">管理</div>
        <a href="users.php" class="menu-item <?php echo $currentPage === 'users' ? 'active' : ''; ?>">
            <span class="menu-icon">◉</span>
            <span>用户管理</span>
        </a>
        <a href="tool_usage.php" class="menu-item <?php echo $currentPage === 'tool_usage' ? 'active' : ''; ?>">
            <span class="menu-icon">◎</span>
            <span>工具统计</span>
        </a>

        <div class="menu-section">日志</div>
        <a href="user_logs.php" class="menu-item <?php echo $currentPage === 'user_logs' ? 'active' : ''; ?>">
            <span class="menu-icon">◇</span>
            <span>使用日志</span>
        </a>
        <a href="login_logs.php" class="menu-item <?php echo $currentPage === 'login_logs' ? 'active' : ''; ?>">
            <span class="menu-icon">◆</span>
            <span>登录日志</span>
        </a>

        <div class="menu-section">展示</div>
        <a href="data_screen.php" class="menu-item <?php echo $currentPage === 'data_screen' ? 'active' : ''; ?>">
            <span class="menu-icon">▣</span>
            <span>数据大屏</span>
        </a>
    </nav>

    <div class="sidebar-footer">
        <a href="?action=logout" class="menu-item logout-btn">
            <span class="menu-icon">◁</span>
            <span>退出登录</span>
        </a>
        <p class="sidebar-footer-text">抹印小栈 v1.2.0</p>
    </div>
</aside>
