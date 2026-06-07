<?php
/**
 * 数据库表结构修复脚本
 * 自动检测并修复表结构不匹配问题
 */

require_once __DIR__ . '/includes/db.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>数据库表结构修复工具</h1>";
echo "<pre>";

// 预期的表结构
$expectedStructure = [
    'login_logs' => [
        'columns' => [
            'id' => 'INT PRIMARY KEY AUTO_INCREMENT',
            'user_id' => 'INT',
            'login_type' => "ENUM('admin', 'user') NOT NULL",
            'login_time' => 'DATETIME DEFAULT CURRENT_TIMESTAMP',
            'ip_address' => 'VARCHAR(50)',
            'user_agent' => 'TEXT'
        ]
    ],
    'tool_usage' => [
        'columns' => [
            'id' => 'INT PRIMARY KEY AUTO_INCREMENT',
            'user_id' => 'INT',
            'tool_id' => 'VARCHAR(50) NOT NULL',
            'used_at' => 'DATETIME DEFAULT CURRENT_TIMESTAMP',
            'ip_address' => 'VARCHAR(50)'
        ]
    ],
    'users' => [
        'columns' => [
            'id' => 'INT PRIMARY KEY AUTO_INCREMENT',
            'openid' => 'VARCHAR(100) NOT NULL UNIQUE',
            'nickname' => "VARCHAR(100) DEFAULT '微信用户'",
            'avatar_url' => 'TEXT',
            'first_login' => 'DATETIME DEFAULT CURRENT_TIMESTAMP',
            'last_login' => 'DATETIME DEFAULT CURRENT_TIMESTAMP',
            'login_count' => 'INT DEFAULT 1',
            'created_at' => 'DATETIME DEFAULT CURRENT_TIMESTAMP'
        ]
    ]
];

// 检查并修复每个表
foreach ($expectedStructure as $tableName => $tableInfo) {
    echo "<h2>检查表: {$tableName}</h2>";

    try {
        // 获取当前表结构
        $result = db()->query("DESCRIBE `{$tableName}`");
        $currentColumns = $result->fetchAll(PDO::FETCH_ASSOC);

        echo "当前列数: " . count($currentColumns) . "<br>";
        echo "预期列数: " . count($tableInfo['columns']) . "<br>";

        // 检查是否有缺少的列
        $currentColumnNames = array_column($currentColumns, 'Field');
        $expectedColumnNames = array_keys($tableInfo['columns']);

        $missingColumns = array_diff($expectedColumnNames, $currentColumnNames);
        $extraColumns = array_diff($currentColumnNames, $expectedColumnNames);

        if (!empty($missingColumns)) {
            echo "<span style='color: orange;'>缺少列: " . implode(', ', $missingColumns) . "</span><br>";

            // 添加缺少的列
            foreach ($missingColumns as $columnName) {
                $columnDef = $tableInfo['columns'][$columnName];
                $sql = "ALTER TABLE `{$tableName}` ADD COLUMN `{$columnName}` {$columnDef}";
                echo "执行: {$sql}<br>";
                try {
                    db()->query($sql);
                    echo "<span style='color: green;'>✓ 列 {$columnName} 添加成功</span><br>";
                } catch (PDOException $e) {
                    echo "<span style='color: red;'>✗ 添加失败: " . $e->getMessage() . "</span><br>";
                }
            }
        }

        if (!empty($extraColumns)) {
            echo "<span style='color: orange;'>多余列: " . implode(', ', $extraColumns) . "</span><br>";
        }

        if (empty($missingColumns) && empty($extraColumns)) {
            echo "<span style='color: green;'>✓ 表结构正确</span><br>";
        }

    } catch (PDOException $e) {
        echo "<span style='color: red;'>表 {$tableName} 不存在或出错: " . $e->getMessage() . "</span><br>";

        // 尝试创建表
        echo "<span style='color: orange;'>尝试创建表 {$tableName}...</span><br>";
        $createSql = generateCreateTableSql($tableName, $tableInfo);
        echo "执行: {$createSql}<br>";
        try {
            db()->query($createSql);
            echo "<span style='color: green;'>✓ 表 {$tableName} 创建成功</span><br>";
        } catch (PDOException $e2) {
            echo "<span style='color: red;'>✗ 创建失败: " . $e2->getMessage() . "</span><br>";
        }
    }

    echo "<br>";
}

// 生成建表SQL
function generateCreateTableSql($tableName, $tableInfo) {
    $columns = $tableInfo['columns'];
    $columnDefs = [];

    foreach ($columns as $columnName => $columnDef) {
        $columnDefs[] = "`{$columnName}` {$columnDef}";
    }

    $columnsSql = implode(', ', $columnDefs);

    return "CREATE TABLE IF NOT EXISTS `{$tableName}` (
        {$columnsSql}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
}

echo "</pre>";
echo "<p><a href='dashboard.php'>返回控制面板</a></p>";
?>
