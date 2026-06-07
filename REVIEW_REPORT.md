# 代码审查报告 - 抹印小栈

**审查时间**: 2026-06-07
**审查范围**: 小程序前端 + PHP后台管理系统
**审查方法**: 9角度并行扫描 + 验证 + 缺口扫描

---

## 发现问题汇总

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| 🔴 严重 | 4 | 安全漏洞，可能导致数据泄露或服务器被入侵 |
| 🟠 高危 | 5 | 逻辑漏洞，影响功能正确性或数据一致性 |
| 🟡 中等 | 4 | 性能或用户体验问题 |
| 🔵 低危 | 2 | 代码质量或维护性问题 |

---

## 🔴 严重问题 (4个)

### 1. SQL注入风险 - 表名/字段名未转义

**文件**: `接口/admin/includes/db.php:50,56,63`
**问题**: `insert`, `update`, `delete` 方法直接拼接表名和字段名

```php
public function insert($table, $data) {
    $keys = array_keys($data);
    $fields = implode(',', $keys);  // ⚠️ 直接拼接，未验证
    $sql = "INSERT INTO {$table} ({$fields}) VALUES ({$placeholders})";
}
```

**风险**: 如果调用者传入恶意表名/字段名，可能导致SQL注入
**修复方案**:
```php
public function insert($table, $data) {
    // 验证表名和字段名只包含合法字符
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
        throw new InvalidArgumentException("非法表名: {$table}");
    }
    foreach (array_keys($data) as $key) {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
            throw new InvalidArgumentException("非法字段名: {$key}");
        }
    }
    // ... 原有逻辑
}
```

---

### 2. 文件上传无安全验证

**文件**: `接口/admin/api/track.php:39-59`
**问题**: 头像上传函数缺少以下验证：
- 文件类型验证
- 文件大小限制
- base64数据格式验证
- 文件内容恶意代码检测

```php
function uploadAvatar($avatarData, $openid) {
    // ⚠️ 没有任何验证
    $data = base64_decode($avatarData);
    if ($data) {
        file_put_contents($filepath, $data);  // 直接写入
    }
}
```

**风险**: 攻击者可上传PHP webshell等恶意文件
**修复方案**:
```php
function uploadAvatar($avatarData, $openid) {
    if (empty($avatarData)) return '';
    
    // 1. 验证base64格式
    if (!preg_match('/^data:image\/(jpeg|png|gif);base64,/', $avatarData, $matches)) {
        return '';
    }
    
    // 2. 移除base64前缀
    $avatarData = preg_replace('/^data:image\/\w+;base64,/', '', $avatarData);
    
    // 3. 解码并验证
    $data = base64_decode($avatarData);
    if ($data === false) return '';
    
    // 4. 验证文件大小 (最大2MB)
    if (strlen($data) > 2 * 1024 * 1024) return '';
    
    // 5. 验证图片类型
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($data);
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($mime, $allowedTypes)) return '';
    
    // 6. 生成安全文件名
    $ext = str_replace('image/', '.', $mime);
    $filename = bin2hex(random_bytes(16)) . $ext;
    // ... 写入文件
}
```

---

### 3. 路径遍历漏洞

**文件**: `接口/admin/api/track.php:49,73`
**问题**: 文件名使用openid拼接，未过滤路径字符

```php
$filename = $openid . '_' . time() . '.jpg';  // ⚠️ openid可能包含../
$filepath = $uploadDir . $filename;
```

**风险**: 攻击者可构造openid为`../../etc/passwd`，写入任意位置
**修复方案**:
```php
// 过滤openid中的非法字符
$openid = preg_replace('/[^a-zA-Z0-9_-]/', '', $openid);
$filename = $openid . '_' . time() . '.jpg';
```

---

### 4. API无认证机制

**文件**: `接口/admin/api/track.php:1-17`
**问题**: track接口完全开放，任何人可调用

```php
// ⚠️ 没有任何认证
header('Access-Control-Allow-Origin: *');  // 允许任何来源
```

**风险**: 可被刷接口，产生大量虚假数据
**修复方案**:
```php
// 1. 验证请求来源
$allowedOrigins = ['https://moyin.awenz.cn'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origin, $allowedOrigins)) {
    http_response_code(403);
    exit('Forbidden');
}

// 2. 添加API密钥验证
$apiKey = $input['api_key'] ?? '';
if ($apiKey !== 'your-secret-api-key') {
    error('API密钥错误');
}

// 3. 添加频率限制
$ip = getUserIP();
$rateLimitKey = 'rate_limit_' . $ip;
// ... 实现频率限制逻辑
```

---

## 🟠 高危问题 (5个)

### 5. 登录日志用户ID可能为null

**文件**: `接口/admin/api/track.php:137-142`
**问题**: 新用户创建后立即记录登录日志，但insert可能失败

```php
$userId = db()->insert('users', [...]);  // 可能返回null

db()->insert('login_logs', [
    'user_id' => $userId,  // ⚠️ 可能为null
    ...
]);
```

**影响**: 登录日志中出现大量user_id为null的记录
**修复方案**:
```php
if ($userId) {
    db()->insert('login_logs', [
        'user_id' => $userId,
        ...
    ]);
}
```

---

### 6. 上周日期计算错误

**文件**: `接口/admin/dashboard.php:55-58`
**问题**: `strtotime('-7 days')`是7天前，不是上周结束

```php
$lastWeekUsage = db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [
    date('Y-m-d', strtotime('-13 days')),
    date('Y-m-d', strtotime('-7 days'))  // ⚠️ 这是7天前，不是上周
]);
```

**影响**: 周对比数据不准确
**修复方案**:
```php
// 获取上周的开始和结束
$lastWeekStart = date('Y-m-d', strtotime('last monday -7 days'));
$lastWeekEnd = date('Y-m-d', strtotime('last sunday -7 days'));

$lastWeekUsage = db()->count('tool_usage', "DATE(used_at) BETWEEN ? AND ?", [
    $lastWeekStart,
    $lastWeekEnd
]);
```

---

### 7. 日均使用计算使用硬编码日期

**文件**: `接口/admin/dashboard.php:281`
**问题**: 使用'2024-01-01'作为上线日期，不准确

```php
$dailyAvg = $totalUsage / max(1, (int)((time() - strtotime('2024-01-01')) / 86400));
```

**影响**: 日均数据不准确
**修复方案**:
```php
// 从数据库获取最早的使用记录
$firstUsage = db()->fetch("SELECT MIN(used_at) as first_date FROM tool_usage");
$startDate = $firstUsage['first_date'] ?? '2024-01-01';
$daysSinceLaunch = max(1, (int)((time() - strtotime($startDate)) / 86400));
$dailyAvg = round($stats['total_usage'] / $daysSinceLaunch);
```

---

### 8. 版本号不一致

**文件**: `接口/admin/includes/sidebar.php:57`
**问题**: 侧边栏显示v1.1.0，但README已是v1.2.0

```php
<p class="sidebar-footer-text">抹印小栈 v1.1.0</p>  // ⚠️ 应该是v1.2.0
```

**影响**: 版本信息混乱
**修复方案**:
```php
<p class="sidebar-footer-text">抹印小栈 v1.2.0</p>
```

---

### 9. 数据库连接失败暴露敏感信息

**文件**: `接口/admin/includes/db.php:16-18`
**问题**: 直接die并输出错误信息

```php
} catch (PDOException $e) {
    die("数据库连接失败: " . $e->getMessage());  // ⚠️ 暴露数据库信息
}
```

**影响**: 泄露数据库主机、用户名等敏感信息
**修复方案**:
```php
} catch (PDOException $e) {
    error_log("数据库连接失败: " . $e->getMessage());  // 记录到日志
    http_response_code(500);
    echo json_encode(['code' => 500, 'message' => '服务器内部错误']);
    exit;
}
```

---

## 🟡 中等问题 (4个)

### 10. 登录无CSRF保护

**文件**: `接口/admin/index.php:10-19`
**问题**: 登录表单没有CSRF token验证

**风险**: 可被CSRF攻击，伪造登录请求
**修复方案**:
```php
// 生成CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// 表单中添加
echo '<input type="hidden" name="csrf_token" value="' . $_SESSION['csrf_token'] . '">';

// 验证
if ($_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    die('CSRF验证失败');
}
```

---

### 11. 收藏数据不同步

**文件**: `pages/favorite/favorite.js`
**问题**: 收藏数据仅存储在本地，多设备不同步

**影响**: 用户换设备后收藏丢失
**修复方案**:
```javascript
// 在onConfirmLogin后同步收藏到服务器
onConfirmLogin() {
    // ... 原有逻辑
    
    // 同步收藏到服务器
    this._syncFavoritesToServer()
}

_syncFavoritesToServer() {
    const favoriteIds = wx.getStorageSync(FAVORITE_TOOLS_KEY) || []
    wx.request({
        url: app.globalData.apiBaseUrl + '/sync.php',
        method: 'POST',
        data: { action: 'sync_favorites', favorites: favoriteIds }
    })
}
```

---

### 12. _recordUseCount重复定义

**文件**: `pages/index/index.js`, `pages/category/category.js`, `pages/favorite/favorite.js`, `pages/profile/profile.js`
**问题**: 相同方法在4个文件中重复定义

**影响**: 维护困难，修改时容易遗漏
**修复方案**:
```javascript
// utils/common.js
export function recordUseCount() {
    const stats = wx.getStorageSync('user-stats') || {
        totalUseCount: 0,
        firstUseDate: new Date().toISOString().split('T')[0]
    }
    stats.totalUseCount = (stats.totalUseCount || 0) + 1
    stats.lastUseDate = new Date().toISOString().split('T')[0]
    wx.setStorageSync('user-stats', stats)
}

// 各页面引用
const { recordUseCount } = require('../../utils/common')
```

---

### 13. 数据大屏自动刷新体验差

**文件**: `接口/admin/data_screen.php:592-594`
**问题**: 使用`location.reload()`刷新，会导致页面闪烁

```javascript
setInterval(function() {
    location.reload();  // ⚠️ 体验差
}, 30000);
```

**修复方案**:
```javascript
// 使用AJAX局部刷新
setInterval(function() {
    fetch('api/stats.php?action=dashboard')
        .then(res => res.json())
        .then(data => {
            // 更新DOM
            document.getElementById('todayUsage').textContent = data.today_usage;
        });
}, 30000);
```

---

## 🔵 低危问题 (2个)

### 14. 登录页面年份硬编码

**文件**: `接口/admin/index.php:279`
**问题**: 版权年份硬编码为2024

```php
<div class="login-footer">© 2024 抹印小栈</div>  // ⚠️ 应该动态
```

**修复方案**:
```php
<div class="login-footer">© <?php echo date('Y'); ?> 抹印小栈</div>
```

---

### 15. 缺少输入长度限制

**文件**: `接口/admin/index.php`, `接口/admin/api/track.php`
**问题**: 用户输入没有长度限制

**影响**: 可能导致存储异常或性能问题
**修复方案**:
```php
// 验证输入长度
$username = substr($_POST['username'] ?? '', 0, 50);
$password = substr($_POST['password'] ?? '', 0, 100);
$nickname = mb_substr($input['nickname'] ?? '微信用户', 0, 50);
```

---

## 修复优先级建议

### 立即修复 (严重)
1. 文件上传安全验证 (问题2)
2. 路径遍历防护 (问题3)
3. API认证机制 (问题4)
4. SQL注入防护 (问题1)

### 本周修复 (高危)
5. 登录日志用户ID处理 (问题5)
6. 日期计算修复 (问题6, 7)
7. 版本号更新 (问题8)
8. 错误信息处理 (问题9)

### 下周修复 (中等)
9. CSRF保护 (问题10)
10. 收藏数据同步 (问题11)
11. 代码重复消除 (问题12)
12. 数据大屏优化 (问题13)

### 后续优化 (低危)
13. 版权年份动态化 (问题14)
14. 输入长度限制 (问题15)

---

## 审查结论

本次审查发现 **15个问题**，其中4个严重安全漏洞需要立即修复。建议按照修复优先级逐步处理，确保系统安全稳定运行。
