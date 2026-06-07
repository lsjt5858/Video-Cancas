import { Film, GitBranch, Layers3, Play, Upload } from "lucide-react";
import { CanvasPreview } from "../features/canvas/CanvasPreview";
import { ProjectPanel } from "../features/projects/ProjectPanel";

const workflow = [
  "剧本",
  "分镜",
  "提示词",
  "生图",
  "生视频",
  "粗剪",
  "导出",
];

export function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-500 text-zinc-950">
              <Film size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold">Video Cancas</div>
              <div className="text-xs text-zinc-400">AI 视频无限画布工作台</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 items-center gap-2 rounded border border-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-900">
              <Upload size={16} />
              导入剧本
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded bg-emerald-500 px-3 text-sm font-medium text-zinc-950 hover:bg-emerald-400">
              <Play size={16} />
              生成分镜
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-[300px_1fr] gap-0 px-5 py-5">
        <aside className="border-r border-zinc-800 pr-5">
          <ProjectPanel />
        </aside>
        <div className="pl-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">导演画布</h1>
              <p className="mt-1 text-sm text-zinc-400">
                从剧本拆分、镜头生成到粗剪导出的 MVP 工作流。
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Layers3 size={16} />
              <span>阶段 0：框架搭建</span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-7 gap-2">
            {workflow.map((step, index) => (
              <div
                className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-xs"
                key={step}
              >
                <span className="mr-1 text-zinc-500">{index + 1}</span>
                {step}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_280px] gap-4">
            <CanvasPreview />
            <section className="rounded border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <GitBranch size={16} />
                右侧属性面板
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">节点类型</dt>
                  <dd className="mt-1 text-zinc-200">shot</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">当前状态</dt>
                  <dd className="mt-1 text-zinc-200">prompt_ready</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">下一步</dt>
                  <dd className="mt-1 text-zinc-200">接入真实 API 和持久化画布节点</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
