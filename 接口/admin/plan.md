# 后台管理系统实现计划

## 一、数据库设计

### 1. admins（管理员表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(255) | 密码（加密） |
| created_at | DATETIME | 创建时间 |

### 2. users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| openid | VARCHAR(100) | 微信openid |
| nickname | VARCHAR(100) | 昵称 |
| avatar_url | TEXT | 头像URL |
| first_login | DATETIME | 首次登录时间 |
| last_login | DATETIME | 最后登录时间 |
| login_count | INT | 登录次数 |
| created_at | DATETIME | 创建时间 |

### 3. tools（工具表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| tool_id | VARCHAR(50) | 工具ID |
| name | VARCHAR(100) | 工具名称 |
| category | VARCHAR(50) | 分类 |
| created_at | DATETIME | 创建时间 |

### 4. tool_usage（工具使用记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| tool_id | VARCHAR(50) | 工具ID |
| used_at | DATETIME | 使用时间 |
| ip_address | VARCHAR(50) | IP地址 |

### 5. login_logs（登录日志表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| login_type | VARCHAR(20) | 登录类型（admin/user） |
| login_time | DATETIME | 登录时间 |
| ip_address | VARCHAR(50) | IP地址 |
| user_agent | TEXT | 浏览器信息 |

## 二、文件结构

```
接口/admin/
├── index.php              # 入口文件/登录页
├── dashboard.php          # 数据看板
├── users.php              # 用户管理
├── tool_usage.php         # 工具使用统计
├── user_logs.php          # 用户使用日志
├── login_logs.php         # 登录日志
├── data_screen.php        # 数据大屏
├── config/
│   └── database.php       # 数据库配置
├── includes/
│   ├── auth.php           # 登录验证
│   ├── db.php             # 数据库连接
│   └── functions.php      # 公共函数
├── api/
│   ├── login.php          # 登录API
│   ├── stats.php          # 统计数据API
│   ├── users.php          # 用户API
│   └── export.php         # 导出API
└── assets/
    ├── css/
    │   └── style.css      # 样式
    └── js/
        └── app.js         # 脚本
```

## 三、功能模块

### 1. 登录验证
- 管理员登录页面
- Session验证
- 登录日志记录

### 2. 数据看板（Dashboard）
- 今日使用次数
- 今日新增用户
- 总用户数
- 总使用次数
- 24小时使用趋势图
- 工具使用TOP10

### 3. 用户管理
- 用户列表（分页、搜索）
- 用户详情
- 用户使用统计

### 4. 工具使用统计
- 工具使用排行
- 分类使用统计
- 使用趋势图

### 5. 用户使用日志
- 使用记录列表
- 按用户/工具筛选
- 时间范围筛选

### 6. 登录日志
- 登录记录列表
- 按用户/时间筛选

### 7. 数据导出
- 导出用户数据CSV
- 导出使用记录CSV
- 导出登录日志CSV

### 8. 数据大屏
- 实时数据展示
- 炫酷动画效果
- 自动刷新
- 全屏显示

## 四、技术栈

- **后端**：PHP + MySQL
- **前端**：HTML + CSS + JavaScript
- **图表**：ECharts
- **样式**：自定义CSS（深色科技风格）

## 五、实现步骤

1. 创建数据库和表
2. 编写配置文件和公共函数
3. 实现登录功能
4. 实现数据看板
5. 实现用户管理
6. 实现工具使用统计
7. 实现日志功能
8. 实现数据导出
9. 实现数据大屏
10. 测试和优化
