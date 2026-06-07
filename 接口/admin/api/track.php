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
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('请求方式错误');
}

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

    // 创建头像目录
    $uploadDir = '/www/wwwroot/moyin.awenz.cn/admin/uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 生成文件名
    $filename = $openid . '_' . time() . '.jpg';
    $filepath = $uploadDir . $filename;

    // 解码base64数据
    $data = base64_decode($avatarData);
    if ($data) {
        file_put_contents($filepath, $data);
        return 'https://moyin.awenz.cn/admin/uploads/avatars/' . $filename;
    }
    return '';
}

// 从URL下载头像到服务器
function downloadAvatar($avatarUrl, $openid) {
    if (empty($avatarUrl)) return '';

    // 创建头像目录
    $uploadDir = '/www/wwwroot/moyin.awenz.cn/admin/uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 生成文件名
    $filename = $openid . '_' . time() . '.jpg';
    $filepath = $uploadDir . $filename;

    // 下载文件
    $ch = curl_init($avatarUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'Mozilla/5.0'
    ]);
    $imageData = curl_exec($ch);
    curl_close($ch);

    if ($imageData) {
        file_put_contents($filepath, $imageData);
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
                'nickname' => $nickname,
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
                'nickname' => $nickname,
                'avatar_url' => $localAvatar ?: $avatarUrl
            ]);
        }

        // 记录登录日志
        db()->insert('login_logs', [
            'user_id' => $userId,
            'login_type' => 'user',
            'ip_address' => $ip,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);

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
