### MarkStore Cloud

**极简个人书签云管理器** · 开源自托管 · 无需注册 · 完全私有

一个轻量级、纯原生实现的个人书签工具，专为简洁与隐私设计，支持跨设备无缝同步。

#### 核心特性
- **零注册**：自动生成唯一密钥，无需账号密码
- **本地 + 云端**：localStorage 缓存，断网可用；一键手动同步 MySQL 云端
- **跨设备合并**：输入另一设备密钥，即可合并书签与分类（不去重，分类自动智能匹配）
- **完整管理**：添加/编辑/删除、分类、标签、拖拽、批量导入浏览器书签、搜索、访问统计
- **自动 favicon**：国内高速稳定服务，图标显示完美
- **导出支持**：HTML / JSON 格式
- **响应式**：单页面设计，适配 PC / 手机 / 平板
- **极简部署**：PHP + MySQL，仅 5 个核心文件，宝塔面板几分钟上线

#### 技术栈
- 前端：纯 HTML + CSS + 原生 JS（无框架）
- 后端：PHP + MySQL
- 许可证：MIT

适合厌倦浏览器同步麻烦、注重隐私的用户。数据完全自控，无第三方依赖。

欢迎 Star ⭐ 与贡献！

GitHub: https://github.com/1916637aaa/markstore-cloud

-------------------分    割    线----------------------

### 部署教程(宝塔面板)
1.下载源码并上传到网站根目录
2.创建数据库(数据库名:bookmark_db;用户名:bookmark_user)
3.打开phpmyadmin,点击上方菜单栏sql
  输入print("-- 创建分类表（categories）
CREATE TABLE IF NOT EXISTS `categories` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_key` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    INDEX `idx_user_key` (`user_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建书签表（bookmarks）
CREATE TABLE IF NOT EXISTS `bookmarks` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_key` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` TEXT NOT NULL,
    `category_id` VARCHAR(255) DEFAULT NULL,
    `tags` TEXT DEFAULT NULL,              -- 存储逗号分隔的标签，例如：学习,PHP,工具
    `add_time` BIGINT NOT NULL,            -- 添加时间戳（毫秒）
    `visit_count` INT DEFAULT 0,           -- 访问次数
    `favicon` TEXT DEFAULT NULL,           -- favicon 图片 URL
    INDEX `idx_user_key` (`user_key`),
    INDEX `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;")
执行完成后，你会在左侧看到新创建的两张表：
**categories**
**bookmarks**

### 此时数据库准备完毕，直接打开你的 MarkStore Cloud 主页（index.html），添加书签并点击“上传云端”即可正常使用云同步功能
