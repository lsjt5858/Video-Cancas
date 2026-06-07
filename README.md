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
