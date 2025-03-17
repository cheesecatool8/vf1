# 视频帧提取工具

一个基于 Cloudflare + Render.com 的视频帧提取工具，使用 React 前端和 Python 后端。

## 项目结构

```
项目根目录/
├── frontend/           # 前端代码
│   ├── public/         # 静态资源
│   ├── src/            # React源代码
│   │   ├── components/ # 组件
│   │   ├── App.js      # 主应用
│   │   └── *.css       # 样式文件
│   ├── package.json    # 依赖配置
│   └── *.config.js     # 配置文件
├── api-worker.js       # Cloudflare API Worker 
├── worker.js           # Cloudflare 存储 Worker
├── r2_storage.py       # R2 存储接口
├── r2_lifecycle.py     # R2 生命周期管理
├── web_app.py          # 主Python应用
├── requirements.txt    # Python依赖
└── .env                # 环境变量
```

## 部署指南

### 1. 前端部署至 Cloudflare Pages

- 登录 Cloudflare Dashboard
- 进入 Pages 部分，点击 "创建应用程序"
- 选择 GitHub 仓库连接
- 配置构建设置:
  - 项目名称: `video-frame`
  - 构建命令: `cd frontend && npm install && npm run build`
  - 构建输出目录: `frontend/build`
  - 根目录: `/`
- 添加环境变量:
  - `REACT_APP_API_URL`: API Worker URL
  - `REACT_APP_STORAGE_URL`: 存储 Worker URL

### 2. API代理部署至 Cloudflare Worker

- 登录 Cloudflare Dashboard
- 进入 Workers & Pages 部分，点击 "创建应用程序"
- 选择 "创建服务"
- 使用 `api-worker.js` 文件部署
- 设置路由和自定义域名

### 3. 存储Worker部署至 Cloudflare Worker 并绑定 R2 存储桶

- 登录 Cloudflare Dashboard
- 进入 Workers & Pages 部分，点击 "创建应用程序"
- 选择 "创建服务"
- 使用 `worker.js` 文件部署
- 绑定 R2 存储桶:
  - 变量名: `BUCKET`
  - 存储桶: `cheesecatool`

### 4. 后端部署至 Render.com

- 登录 Render.com
- 创建一个新的 Web Service
- 连接 GitHub 仓库
- 配置:
  - 名称: `cheesecatool-backend`
  - 构建命令: `pip install -r requirements.txt`
  - 启动命令: `gunicorn web_app:app`
- 添加环境变量 (从 .env 文件提取)

## 功能特点

- 视频帧提取：上传视频文件或提供视频URL，提取关键帧
- 帧查看和下载：浏览、预览和下载提取的视频帧
- 自动清理：支持R2存储中文件的自动清理功能
- 响应式界面：适应不同设备尺寸的美观界面

## 开发和本地运行

1. 安装依赖:
   ```
   pip install -r requirements.txt
   cd frontend && npm install
   ```

2. 运行后端:
   ```
   python web_app.py
   ```

3. 运行前端:
   ```
   cd frontend && npm start
   ```
