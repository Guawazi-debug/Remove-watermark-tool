<?php
require_once __DIR__ . '/../config/database.php';

class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            error_log("数据库连接失败: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['code' => 500, 'message' => '服务器内部错误']);
            exit;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }

    public function query($sql, $params = []) {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetch($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }

    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }

    public function insert($table, $data) {
        // 验证表名只包含合法字符
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
            throw new InvalidArgumentException("非法表名: {$table}");
        }

        // 验证字段名只包含合法字符
        foreach (array_keys($data) as $key) {
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
                throw new InvalidArgumentException("非法字段名: {$key}");
            }
        }

        $keys = array_keys($data);
        $fields = implode(',', $keys);
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $sql = "INSERT INTO `{$table}` (`{$fields}`) VALUES ({$placeholders})";
        $this->query($sql, array_values($data));
        return $this->conn->lastInsertId();
    }

    public function update($table, $data, $where, $whereParams = []) {
        // 验证表名只包含合法字符
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
            throw new InvalidArgumentException("非法表名: {$table}");
        }

        // 验证字段名只包含合法字符
        foreach (array_keys($data) as $key) {
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
                throw new InvalidArgumentException("非法字段名: {$key}");
            }
        }

        $set = implode(',', array_map(function($k) { return "`{$k}` = ?"; }, array_keys($data)));
        $sql = "UPDATE `{$table}` SET {$set} WHERE {$where}";
        $params = array_merge(array_values($data), $whereParams);
        return $this->query($sql, $params)->rowCount();
    }

    public function delete($table, $where, $params = []) {
        // 验证表名只包含合法字符
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
            throw new InvalidArgumentException("非法表名: {$table}");
        }

        $sql = "DELETE FROM `{$table}` WHERE {$where}";
        return $this->query($sql, $params)->rowCount();
    }

    public function count($table, $where = '1', $params = []) {
        // 验证表名只包含合法字符
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
            throw new InvalidArgumentException("非法表名: {$table}");
        }

        $sql = "SELECT COUNT(*) as count FROM `{$table}` WHERE {$where}";
        return $this->fetch($sql, $params)['count'];
    }
}

function db() {
    return Database::getInstance();
}
