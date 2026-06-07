-- 抹印小栈后台管理系统数据库初始化脚本
-- 数据库名: moyinxiaozhan
-- 版本: v1.3.0
-- 日期: 2026-06-07

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `moyinxiaozhan` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `moyinxiaozhan`;

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 清空现有表
DROP TABLE IF EXISTS `login_logs`;
DROP TABLE IF EXISTS `tool_usage`;
DROP TABLE IF EXISTS `tools`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `admins`;

-- 启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- 管理员表
-- ----------------------------
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员 (admin/admin123)
INSERT INTO `admins` (`username`, `password`) VALUES
('admin', '$2y$10$kXYQ8qst/utvw/lMnYwRU.AyNCPyNx5nelKDB5Oq40Ml4QlsvaQJi');

-- ----------------------------
-- 用户表
-- ----------------------------
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) NOT NULL,
  `nickname` varchar(100) DEFAULT '微信用户',
  `avatar_url` text,
  `first_login` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT CURRENT_TIMESTAMP,
  `login_count` int(11) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`),
  KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 工具表
-- ----------------------------
CREATE TABLE `tools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tool_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tool_id` (`tool_id`),
  KEY `idx_tool_id` (`tool_id`)
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

-- ----------------------------
-- 工具使用记录表
-- ----------------------------
CREATE TABLE `tool_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `tool_id` varchar(50) NOT NULL,
  `used_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tool_id` (`tool_id`),
  KEY `idx_used_at` (`used_at`),
  CONSTRAINT `tool_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 登录日志表
-- ----------------------------
CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `login_type` enum('admin','user') NOT NULL,
  `login_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 完成
SELECT '数据库初始化完成！' AS message;
SELECT COUNT(*) AS tool_count FROM tools;
