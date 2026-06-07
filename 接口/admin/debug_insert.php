<?php
/**
 * 调试插入脚本
 * 用于排查插入语句的列数不匹配问题
 */

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>调试插入脚本</h1>";
echo "<pre>";

// 测试插入 login_logs
echo "<h2>测试插入 login_logs</h2>";

$loginLogsFields = [
    'user_id' => 1,
    'login_type' => 'user',
    'login_time' => date('Y-m-d H:i:s'),
    'ip_address' => '127.0.0.1',
    'user_agent' => 'Debug Script'
];

echo "插入字段: " . count($loginLogsFields) . " 个<br>";
echo "字段列表: " . implode(', ', array_keys($loginLogsFields)) . "<br>";

try {
    $id = db()->insert('login_logs', $loginLogsFields);
    echo "<span style='color: green;'>✓ 插入成功，ID: {$id}</span><br>";
} catch (PDOException $e) {
    echo "<span style='color: red;'>✗ 插入失败: " . $e->getMessage() . "</span><br>";
}

echo "<br>";

// 测试插入 tool_usage
echo "<h2>测试插入 tool_usage</h2>";

$toolUsageFields = [
    'user_id' => 1,
    'tool_id' => 'debug-test',
    'used_at' => date('Y-m-d H:i:s'),
    'ip_address' => '127.0.0.1'
];

echo "插入字段: " . count($toolUsageFields) . " 个<br>";
echo "字段列表: " . implode(', ', array_keys($toolUsageFields)) . "<br>";

try {
    $id = db()->insert('tool_usage', $toolUsageFields);
    echo "<span style='color: green;'>✓ 插入成功，ID: {$id}</span><br>";
} catch (PDOException $e) {
    echo "<span style='color: red;'>✗ 插入失败: " . $e->getMessage() . "</span><br>";
}

echo "<br>";

// 显示表结构
echo "<h2>表结构信息</h2>";

$tables = ['login_logs', 'tool_usage', 'users'];
foreach ($tables as $table) {
    echo "<h3>{$table}</h3>";
    try {
        $result = db()->query("DESCRIBE `{$table}`");
        $columns = $result->fetchAll(PDO::FETCH_ASSOC);
        echo "列数: " . count($columns) . "<br>";
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>字段名</th><th>类型</th><th>允许NULL</th><th>键</th><th>默认值</th></tr>";
        foreach ($columns as $col) {
            echo "<tr>";
            echo "<td>{$col['Field']}</td>";
            echo "<td>{$col['Type']}</td>";
            echo "<td>{$col['Null']}</td>";
            echo "<td>{$col['Key']}</td>";
            echo "<td>{$col['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } catch (PDOException $e) {
        echo "<span style='color: red;'>错误: " . $e->getMessage() . "</span><br>";
    }
    echo "<br>";
}

// 检查最近的插入记录
echo "<h2>最近的登录日志</h2>";
try {
    $logs = db()->fetchAll("SELECT * FROM login_logs ORDER BY id DESC LIMIT 5");
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>user_id</th><th>login_type</th><th>login_time</th><th>ip_address</th></tr>";
    foreach ($logs as $log) {
        echo "<tr>";
        echo "<td>{$log['id']}</td>";
        echo "<td>{$log['user_id']}</td>";
        echo "<td>{$log['login_type']}</td>";
        echo "<td>{$log['login_time']}</td>";
        echo "<td>{$log['ip_address']}</td>";
        echo "</tr>";
    }
    echo "</table>";
} catch (PDOException $e) {
    echo "<span style='color: red;'>错误: " . $e->getMessage() . "</span><br>";
}

echo "</pre>";
echo "<p><a href='dashboard.php'>返回控制面板</a></p>";
?>
