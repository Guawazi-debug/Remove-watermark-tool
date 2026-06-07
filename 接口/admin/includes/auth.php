<?php
require_once __DIR__ . '/db.php';

function isLoggedIn() {
    return isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id']);
}

// 检查退出登录请求
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header('Location: index.php');
    exit;
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: index.php');
        exit;
    }
}

function getAdmin() {
    if (!isLoggedIn()) return null;
    return db()->fetch("SELECT * FROM admins WHERE id = ?", [$_SESSION['admin_id']]);
}

function login($username, $password) {
    $admin = db()->fetch("SELECT * FROM admins WHERE username = ?", [$username]);
    if ($admin && password_verify($password, $admin['password'])) {
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_username'] = $admin['username'];

        // 记录登录日志（管理员user_id设为NULL）
        db()->insert('login_logs', [
            'user_id' => null,
            'login_type' => 'admin',
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);

        return true;
    }
    return false;
}

function logout() {
    session_destroy();
    header('Location: index.php');
    exit;
}

function getUserIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}
