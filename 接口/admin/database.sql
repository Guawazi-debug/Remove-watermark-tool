-- 抹印小栈后台管理系统数据库
-- 数据库名: moyinxiaozhan

-- 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员 (admin/admin123)
-- 密码通过 fix_password.php 脚本设置
INSERT INTO `admins` (`username`, `password`) VALUES
('admin', '$2y$10$placeholder');

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `openid` VARCHAR(100) NOT NULL UNIQUE,
  `nickname` VARCHAR(100) DEFAULT '微信用户',
  `avatar_url` TEXT,
  `first_login` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `login_count` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 工具表
CREATE TABLE IF NOT EXISTS `tools` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `tool_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tool_id` (`tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入工具数据
INSERT INTO `tools` (`tool_id`, `name`, `category`) VALUES
('video-parse', '视频解析', '媒体工具'),
('json-parse', 'JSON 解析', '文本处理'),
('json-generate', 'JSON 生成', '文本处理'),
('base64', 'Base64', '文本处理'),
('url-encode', 'URL 编解码', '文本处理'),
('text-diff', '文本对比', '文本处理'),
('word-count', '字数统计', '文本处理'),
('regex-test', '正则测试', '文本处理'),
('case-convert', '大小写转换', '文本处理'),
('text-replace', '文本替换', '文本处理'),
('text-dedup', '文本去重', '文本处理'),
('unicode', 'Unicode', '文本处理'),
('html-escape', 'HTML 转义', '文本处理'),
('hash', 'MD5 / SHA', '编码与安全'),
('jwt-decode', 'JWT 解析', '编码与安全'),
('uuid', 'UUID 生成', '编码与安全'),
('timestamp', '时间戳转换', '开发辅助'),
('color-convert', '颜色转换', '开发辅助'),
('password-gen', '密码生成', '开发辅助'),
('json-diff', 'JSON 对比', '开发辅助'),
('cron-gen', 'Cron 生成', '开发辅助'),
('css-unit', 'CSS 单位转换', '开发辅助'),
('code-format', '代码格式化', '开发辅助'),
('radix', '进制转换', '计算与生活'),
('unit-convert', '单位转换', '计算与生活'),
('calculator', '计算器', '计算与生活'),
('date-calc', '日期计算', '计算与生活'),
('age-calc', '年龄计算', '计算与生活'),
('bmi', 'BMI 计算', '计算与生活'),
('tax-calc', '个税计算', '计算与生活'),
('loan-calc', '贷款计算', '计算与生活');

-- 工具使用记录表
CREATE TABLE IF NOT EXISTS `tool_usage` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `tool_id` VARCHAR(50) NOT NULL,
  `used_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(50),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_tool_id` (`tool_id`),
  INDEX `idx_used_at` (`used_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 登录日志表
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `login_type` ENUM('admin', 'user') NOT NULL,
  `login_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(50),
  `user_agent` TEXT,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
