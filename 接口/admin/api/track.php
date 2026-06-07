<?php
/**
 * 小程序数据追踪API
 * 用于记录用户使用数据
 */
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('请求方式错误');
}

// API密钥验证
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$validApiKeys = [
    'moyin-api-key-v1.2.0'  // 实际使用时应从配置文件读取
];

if (!in_array($apiKey, $validApiKeys)) {
    error('API密钥无效', 403);
}

// 简单的频率限制（每IP每分钟最多60次请求）
$ip = getUserIP();
$rateLimitFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip);
$now = time();
$window = 60; // 1分钟窗口

if (file_exists($rateLimitFile)) {
    $data = json_decode(file_get_contents($rateLimitFile), true);
    if ($data && ($now - $data['start']) < $window) {
        if ($data['count'] >= 60) {
            error('请求过于频繁，请稍后再试', 429);
        }
        $data['count']++;
    } else {
        $data = ['start' => $now, 'count' => 1];
    }
} else {
    $data = ['start' => $now, 'count' => 1];
}

file_put_contents($rateLimitFile, json_encode($data));

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    error('请求数据为空');
}

$action = $input['action'] ?? '';
$openid = $input['openid'] ?? '';
$toolId = $input['tool_id'] ?? '';
$nickname = $input['nickname'] ?? '微信用户';
$avatarUrl = $input['avatar_url'] ?? '';
$avatarData = $input['avatar_data'] ?? ''; // base64头像数据

$ip = getUserIP();

// 上传头像到服务器
function uploadAvatar($avatarData, $openid) {
    if (empty($avatarData)) return '';

    // 验证base64格式
    if (!preg_match('/^data:image\/(jpeg|png|gif);base64,/', $avatarData, $matches)) {
        return '';
    }

    // 移除base64前缀
    $avatarData = preg_replace('/^data:image\/\w+;base64,/', '', $avatarData);

    // 解码base64数据
    $data = base64_decode($avatarData);
    if ($data === false) {
        return '';
    }

    // 验证文件大小 (最大2MB)
    if (strlen($data) > 2 * 1024 * 1024) {
        return '';
    }

    // 验证图片类型
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($data);
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($mime, $allowedTypes)) {
        return '';
    }

    // 过滤openid中的非法字符，防止路径遍历
    $openid = preg_replace('/[^a-zA-Z0-9_-]/', '', $openid);

    // 创建头像目录
    $uploadDir = '/www/wwwroot/moyin.awenz.cn/admin/uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 生成安全文件名
    $extMap = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/gif' => '.gif'];
    $ext = $extMap[$mime] ?? '.jpg';
    $filename = $openid . '_' . bin2hex(random_bytes(16)) . $ext;
    $filepath = $uploadDir . $filename;

    // 写入文件
    if (file_put_contents($filepath, $data)) {
        return 'https://moyin.awenz.cn/admin/uploads/avatars/' . $filename;
    }
    return '';
}

// 从URL下载头像到服务器
function downloadAvatar($avatarUrl, $openid) {
    if (empty($avatarUrl)) return '';

    // 验证URL格式
    if (!filter_var($avatarUrl, FILTER_VALIDATE_URL)) {
        return '';
    }

    // 只允许http和https协议
    $scheme = parse_url($avatarUrl, PHP_URL_SCHEME);
    if (!in_array($scheme, ['http', 'https'])) {
        return '';
    }

    // 过滤openid中的非法字符，防止路径遍历
    $openid = preg_replace('/[^a-zA-Z0-9_-]/', '', $openid);

    // 创建头像目录
    $uploadDir = '/www/wwwroot/moyin.awenz.cn/admin/uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 下载文件
    $ch = curl_init($avatarUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_USERAGENT => 'Mozilla/5.0'
    ]);
    $imageData = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 验证下载是否成功
    if ($imageData === false || $statusCode !== 200) {
        return '';
    }

    // 验证文件大小 (最大2MB)
    if (strlen($imageData) > 2 * 1024 * 1024) {
        return '';
    }

    // 验证图片类型
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($imageData);
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($mime, $allowedTypes)) {
        return '';
    }

    // 生成安全文件名
    $extMap = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/gif' => '.gif'];
    $ext = $extMap[$mime] ?? '.jpg';
    $filename = $openid . '_' . bin2hex(random_bytes(16)) . $ext;
    $filepath = $uploadDir . $filename;

    // 写入文件
    if (file_put_contents($filepath, $imageData)) {
        return 'https://moyin.awenz.cn/admin/uploads/avatars/' . $filename;
    }
    return '';
}

switch ($action) {
    case 'login':
        // 用户登录/注册
        if (!$openid) {
            error('openid不能为空');
        }

        // 处理头像
        $localAvatar = '';
        if ($avatarData) {
            $localAvatar = uploadAvatar($avatarData, $openid);
        } elseif ($avatarUrl) {
            $localAvatar = downloadAvatar($avatarUrl, $openid);
        }

        // 查找用户
        $user = db()->fetch("SELECT * FROM users WHERE openid = ?", [$openid]);

        if ($user) {
            // 更新用户信息
            $updateData = [
                'nickname' => mb_substr($nickname, 0, 50),  // 限制昵称长度
                'last_login' => date('Y-m-d H:i:s'),
                'login_count' => $user['login_count'] + 1
            ];
            if ($localAvatar) {
                $updateData['avatar_url'] = $localAvatar;
            } elseif ($avatarUrl) {
                $updateData['avatar_url'] = $avatarUrl;
            }

            db()->update('users', $updateData, 'id = ?', [$user['id']]);
            $userId = $user['id'];
        } else {
            // 创建新用户
            $userId = db()->insert('users', [
                'openid' => $openid,
                'nickname' => mb_substr($nickname, 0, 50),  // 限制昵称长度
                'avatar_url' => $localAvatar ?: $avatarUrl
            ]);
        }

        // 记录登录日志（仅在用户ID有效时）
        if ($userId) {
            db()->insert('login_logs', [
                'user_id' => $userId,
                'login_type' => 'user',
                'login_time' => date('Y-m-d H:i:s'),
                'ip_address' => $ip,
                'user_agent' => mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500)
            ]);
        }

        success([
            'user_id' => $userId,
            'openid' => $openid,
            'nickname' => $nickname
        ], '登录成功');
        break;

    case 'track':
        // 记录工具使用
        if (!$openid || !$toolId) {
            error('参数不完整');
        }

        // 查找用户
        $user = db()->fetch("SELECT id, nickname FROM users WHERE openid = ?", [$openid]);
        $userId = $user['id'] ?? null;
        $nickname = $user['nickname'] ?? '未知用户';

        // 记录使用
        db()->insert('tool_usage', [
            'user_id' => $userId,
            'tool_id' => $toolId,
            'used_at' => date('Y-m-d H:i:s'),
            'ip_address' => $ip
        ]);

        // 更新用户最后登录时间
        if ($userId) {
            db()->update('users', [
                'last_login' => date('Y-m-d H:i:s')
            ], 'id = ?', [$userId]);
        }

        success([
            'user_id' => $userId,
            'nickname' => $nickname,
            'tool_id' => $toolId
        ], '记录成功');
        break;

    case 'get_user':
        // 获取用户信息
        if (!$openid) {
            error('openid不能为空');
        }

        $user = db()->fetch("SELECT * FROM users WHERE openid = ?", [$openid]);
        if ($user) {
            // 获取使用次数
            $usageCount = db()->count('tool_usage', "user_id = ?", [$user['id']]);
            $user['usage_count'] = $usageCount;
            success($user);
        } else {
            error('用户不存在');
        }
        break;

    default:
        error('未知操作');
}
