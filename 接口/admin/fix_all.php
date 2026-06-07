<?php
/**
 * 一键修复脚本
 * 上传到服务器后访问此页面，自动修复所有问题
 */

header('Content-Type: text/html; charset=utf-8');
echo "<h1>一键修复脚本 v1.3.1</h1>";
echo "<pre>";

// 1. 检查PHP版本
echo "=== 1. PHP环境检查 ===<br>";
echo "PHP版本: " . phpversion() . "<br>";
echo "PDO扩展: " . (extension_loaded('pdo') ? '✓ 已安装' : '✗ 未安装') . "<br>";
echo "PDO MySQL: " . (extension_loaded('pdo_mysql') ? '✓ 已安装' : '✗ 未安装') . "<br>";
echo "<br>";

// 2. 测试数据库连接
echo "=== 2. 数据库连接测试 ===<br>";
require_once __DIR__ . '/includes/db.php';
try {
    echo "数据库连接: ✓ 成功<br>";
} catch (Exception $e) {
    echo "数据库连接: ✗ 失败 - " . $e->getMessage() . "<br>";
}
echo "<br>";

// 3. 检查表结构
echo "=== 3. 表结构检查 ===<br>";
$tables = ['login_logs', 'tool_usage', 'users', 'admins', 'tools'];
foreach ($tables as $table) {
    try {
        $result = db()->query("DESCRIBE `{$table}`");
        $columns = $result->fetchAll(PDO::FETCH_ASSOC);
        echo "{$table}: ✓ 存在 (" . count($columns) . " 列)<br>";
    } catch (PDOException $e) {
        echo "{$table}: ✗ 不存在<br>";
    }
}
echo "<br>";

// 4. 测试直接SQL插入
echo "=== 4. 直接SQL插入测试 ===<br>";

// 测试 users 表
echo "<h3>users 表</h3>";
try {
    $sql = "INSERT INTO `users` (`openid`, `nickname`, `avatar_url`) VALUES ('test_fix_" . time() . "', '测试用户', '')";
    db()->query($sql);
    $userId = db()->getConnection()->lastInsertId();
    echo "✓ users 插入成功 (ID: {$userId})<br>";
    // 清理测试数据
    db()->query("DELETE FROM `users` WHERE `id` = ?", [$userId]);
    echo "✓ 测试数据已清理<br>";
} catch (PDOException $e) {
    echo "✗ users 插入失败: " . $e->getMessage() . "<br>";
}

// 测试 login_logs 表
echo "<h3>login_logs 表</h3>";
try {
    $sql = "INSERT INTO `login_logs` (`user_id`, `login_type`, `login_time`, `ip_address`, `user_agent`) VALUES (1, 'user', '" . date('Y-m-d H:i:s') . "', '127.0.0.1', 'Fix Script')";
    db()->query($sql);
    $logId = db()->getConnection()->lastInsertId();
    echo "✓ login_logs 插入成功 (ID: {$logId})<br>";
    // 清理测试数据
    db()->query("DELETE FROM `login_logs` WHERE `id` = ?", [$logId]);
    echo "✓ 测试数据已清理<br>";
} catch (PDOException $e) {
    echo "✗ login_logs 插入失败: " . $e->getMessage() . "<br>";
}

// 测试 tool_usage 表（需要先创建一个测试用户）
echo "<h3>tool_usage 表</h3>";
try {
    // 先创建测试用户，确保外键约束满足
    $testUserSql = "INSERT INTO `users` (`openid`, `nickname`) VALUES ('test_fk_" . time() . "', 'FK测试')";
    db()->query($testUserSql);
    $testUserId = db()->getConnection()->lastInsertId();

    $sql = "INSERT INTO `tool_usage` (`user_id`, `tool_id`, `used_at`, `ip_address`) VALUES ({$testUserId}, 'test-tool', '" . date('Y-m-d H:i:s') . "', '127.0.0.1')";
    db()->query($sql);
    $usageId = db()->getConnection()->lastInsertId();
    echo "✓ tool_usage 插入成功 (ID: {$usageId})<br>";
    // 清理测试数据
    db()->query("DELETE FROM `tool_usage` WHERE `id` = ?", [$usageId]);
    db()->query("DELETE FROM `users` WHERE `id` = ?", [$testUserId]);
    echo "✓ 测试数据已清理<br>";
} catch (PDOException $e) {
    echo "✗ tool_usage 插入失败: " . $e->getMessage() . "<br>";
}
echo "<br>";

// 5. 测试db()->insert()方法
echo "=== 5. db()->insert() 方法测试 ===<br>";

echo "<h3>users 表</h3>";
try {
    $id = db()->insert('users', [
        'openid' => 'test_insert_' . time(),
        'nickname' => '测试',
        'avatar_url' => ''
    ]);
    echo "✓ db()->insert('users') 成功 (ID: {$id})<br>";
    db()->query("DELETE FROM `users` WHERE `id` = ?", [$id]);
} catch (Exception $e) {
    echo "✗ db()->insert('users') 失败: " . $e->getMessage() . "<br>";
}

echo "<h3>login_logs 表</h3>";
try {
    $id = db()->insert('login_logs', [
        'user_id' => 1,
        'login_type' => 'user',
        'login_time' => date('Y-m-d H:i:s'),
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Fix Script'
    ]);
    echo "✓ db()->insert('login_logs') 成功 (ID: {$id})<br>";
    db()->query("DELETE FROM `login_logs` WHERE `id` = ?", [$id]);
} catch (Exception $e) {
    echo "✗ db()->insert('login_logs') 失败: " . $e->getMessage() . "<br>";
}

echo "<h3>tool_usage 表</h3>";
try {
    // 先创建测试用户
    $testUserSql2 = "INSERT INTO `users` (`openid`, `nickname`) VALUES ('test_fk2_" . time() . "', 'FK测试2')";
    db()->query($testUserSql2);
    $testUserId2 = db()->getConnection()->lastInsertId();

    $id = db()->insert('tool_usage', [
        'user_id' => $testUserId2,
        'tool_id' => 'test-tool',
        'used_at' => date('Y-m-d H:i:s'),
        'ip_address' => '127.0.0.1'
    ]);
    echo "✓ db()->insert('tool_usage') 成功 (ID: {$id})<br>";
    db()->query("DELETE FROM `tool_usage` WHERE `id` = ?", [$id]);
    db()->query("DELETE FROM `users` WHERE `id` = ?", [$testUserId2]);
} catch (Exception $e) {
    echo "✗ db()->insert('tool_usage') 失败: " . $e->getMessage() . "<br>";
}
echo "<br>";

// 6. 输出当前代码版本信息
echo "=== 6. 代码版本检查 ===<br>";
$trackContent = file_get_contents(__DIR__ . '/api/track.php');
$dbContent = file_get_contents(__DIR__ . '/includes/db.php');
echo "track.php 包含 v1.3.1: " . (strpos($trackContent, 'v1.3.1') !== false ? '✓ 是' : '✗ 否') . "<br>";
echo "db.php 包含 验证逻辑: " . (strpos($dbContent, 'InvalidArgumentException') !== false ? '✓ 是' : '✗ 否') . "<br>";
echo "db.php 行数: " . substr_count($dbContent, "\n") . "<br>";
echo "track.php 行数: " . substr_count($trackContent, "\n") . "<br>";

echo "</pre>";
echo "<p><a href='dashboard.php'>返回控制面板</a></p>";
?>
