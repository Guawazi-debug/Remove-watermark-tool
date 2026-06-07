<?php
require_once __DIR__ . '/includes/auth.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

// 生成CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 验证CSRF token
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        $error = 'CSRF验证失败，请重试';
    } else {
        $username = substr($_POST['username'] ?? '', 0, 50);
        $password = substr($_POST['password'] ?? '', 0, 100);

        if (login($username, $password)) {
            // 登录成功后重新生成CSRF token
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            header('Location: dashboard.php');
            exit;
        } else {
            $error = '用户名或密码错误';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 · 抹印小栈</title>
    <link rel="icon" href="https://moyin.awenz.cn/admin/logo.png" type="image/png">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #1a1714;
            --surface: rgba(35, 31, 27, 0.85);
            --border: rgba(194, 149, 106, 0.12);
            --accent: #c2956a;
            --accent-light: #d4a87a;
            --text: #f0ebe5;
            --text-dim: #7a6e62;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Noto Sans SC', sans-serif;
            background: var(--bg);
            background-image: url('https://moyin.awenz.cn/admin/bg.png');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            position: relative;
            overflow: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: rgba(26, 23, 20, 0.7);
            z-index: 0;
        }

        /* 背景装饰 */
        .bg-decoration {
            position: fixed;
            inset: 0;
            pointer-events: none;
        }

        .bg-decoration::before {
            content: '';
            position: absolute;
            top: -30%;
            right: -20%;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(194, 149, 106, 0.08) 0%, transparent 70%);
            border-radius: 50%;
        }

        .bg-decoration::after {
            content: '';
            position: absolute;
            bottom: -20%;
            left: -15%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(166, 125, 85, 0.06) 0%, transparent 70%);
            border-radius: 50%;
        }

        /* 网格纹理 */
        .grid-pattern {
            position: fixed;
            inset: 0;
            background-image:
                linear-gradient(rgba(194, 149, 106, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(194, 149, 106, 0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            pointer-events: none;
        }

        .login-wrapper {
            width: 100%;
            max-width: 400px;
            padding: 0 24px;
            position: relative;
            z-index: 10;
        }

        .login-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 48px 40px;
            animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cardIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .login-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .login-logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            background: transparent;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .login-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .login-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            letter-spacing: -0.5px;
        }

        .login-subtitle {
            font-size: 14px;
            color: var(--text-dim);
            margin-top: 8px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-dim);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-input {
            width: 100%;
            padding: 14px 16px;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-md, 10px);
            color: var(--text);
            font-size: 15px;
            font-family: inherit;
            transition: all 0.2s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(194, 149, 106, 0.12);
        }

        .form-input::placeholder {
            color: var(--text-dim);
        }

        .login-btn {
            width: 100%;
            padding: 14px;
            margin-top: 8px;
            background: var(--accent);
            border: none;
            border-radius: var(--radius-md, 10px);
            color: var(--bg);
            font-size: 15px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .login-btn:hover {
            background: var(--accent-light);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(194, 149, 106, 0.3);
        }

        .login-btn:active {
            transform: translateY(0);
        }

        .error-msg {
            background: rgba(194, 112, 112, 0.1);
            border: 1px solid rgba(194, 112, 112, 0.2);
            color: #c27070;
            padding: 12px 16px;
            border-radius: var(--radius-md, 10px);
            margin-bottom: 24px;
            font-size: 14px;
            text-align: center;
        }

        .login-footer {
            text-align: center;
            margin-top: 32px;
            font-size: 12px;
            color: var(--text-dim);
        }
    </style>
</head>
<body>
    <div class="bg-decoration"></div>
    <div class="grid-pattern"></div>

    <div class="login-wrapper">
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">
                    <img src="https://moyin.awenz.cn/admin/logo.png" alt="Logo" onerror="this.style.display='none'">
                </div>
                <h1 class="login-title">抹印小栈</h1>
                <p class="login-subtitle">后台管理系统</p>
            </div>

            <?php if ($error): ?>
            <div class="error-msg"><?php echo $error; ?></div>
            <?php endif; ?>

            <form method="POST">
                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input type="text" name="username" class="form-input" placeholder="请输入用户名" required autocomplete="username" maxlength="50">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input type="password" name="password" class="form-input" placeholder="请输入密码" required autocomplete="current-password" maxlength="100">
                </div>
                <button type="submit" class="login-btn">登 录</button>
            </form>

            <div class="login-footer">© <?php echo date('Y'); ?> 抹印小栈</div>
        </div>
    </div>
</body>
</html>
