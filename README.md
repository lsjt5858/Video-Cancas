# Video-Cancas

AI 视频无限画布创作平台。

开发入口文档见 [开发文档.md](开发文档.md)。

## Project Structure

```text
apps/web       React + Vite + TypeScript frontend
apps/api       FastAPI backend
apps/worker    Celery worker for AI and media jobs
infra          Docker Compose dependencies
docs           Product and engineering docs
```

`apps/web` 已迁入第一版前端原型，覆盖项目列表、项目工作台、剧本编辑、分镜表、无限画布、素材库和时间线。当前前端数据仍使用 localStorage，后续会逐步接入 `apps/api`。

## Local Development

```bash
cp .env.example .env
npm install
npm run infra:up
npm run dev:web
npm run dev:api
```

Worker:

```bash
npm run dev:worker
```

The first runnable target is the frontend shell plus API health check. Business modules will be implemented by the staged plan in `docs/05-开发计划与验收.md`.

## Development Tracking

功能开发进度见 [docs/06-功能开发进度.md](docs/06-功能开发进度.md)。
