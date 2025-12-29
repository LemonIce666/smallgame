# 学生教务系统

一个无需额外数据库部署的全栈教务小系统，使用 Node.js + Express + SQLite 提供 API，并内置网页前端完成学生、课程、选课和成绩管理。默认附带示例数据，下载后即可运行。

## 快速开始
1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动服务：
   ```bash
   npm start
   ```
   默认运行在 http://localhost:3000 ，首次启动会自动在 `data/school.db` 创建并填充示例数据。

## 功能
- 学生管理：新增 / 编辑 / 删除 / 列表
- 课程管理：新增 / 编辑 / 删除 / 列表
- 选课管理：为学生选课并展示列表
- 成绩录入：对选课记录单独填写成绩

## 项目结构
```
├── server.js          # Express 入口，提供 API 并托管前端
├── src/db.js          # SQLite 初始化与示例数据填充
├── public/            # 前端静态资源
│   ├── index.html     # 单页界面
│   ├── app.js         # 界面交互逻辑与 API 调用
│   └── styles.css     # 暗色主题样式
├── data/school.db     # 启动时自动创建的 SQLite 文件
└── package.json
```

## API 速览
- `GET /api/students` 列出学生；`POST /api/students` 创建；`PUT /api/students/:id` 更新；`DELETE /api/students/:id` 删除（级联移除选课）
- `GET /api/courses` 列出课程；`POST /api/courses` 创建；`PUT /api/courses/:id` 更新；`DELETE /api/courses/:id` 删除（级联移除选课）
- `GET /api/enrollments` 列出选课；`POST /api/enrollments` 创建；`PUT /api/enrollments/:id/grade` 录入成绩；`DELETE /api/enrollments/:id` 删除

## 备注
- 全部数据存放在本地 SQLite 文件，适合 demo / 本地部署。若需重新初始化，可删除 `data/school.db` 后重启。
- 默认没有鉴权，便于快速演示，正式场景可在路由上添加登录校验。
