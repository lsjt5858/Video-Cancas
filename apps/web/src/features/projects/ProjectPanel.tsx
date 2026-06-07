import { FolderKanban, LayoutList, Timer } from "lucide-react";

const projectMeta = [
  ["项目类型", "AI 短剧"],
  ["画幅", "16:9"],
  ["目标时长", "60 秒"],
  ["状态", "草稿"],
];

export function ProjectPanel() {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <FolderKanban size={18} className="text-emerald-400" />
        <h2 className="text-sm font-semibold">项目管理</h2>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
        <div className="text-sm font-medium">万里寻子</div>
        <div className="mt-1 text-xs text-zinc-500">MVP 示例项目</div>

        <dl className="mt-4 space-y-3">
          {projectMeta.map(([label, value]) => (
            <div className="flex items-center justify-between text-sm" key={label}>
              <dt className="text-zinc-500">{label}</dt>
              <dd className="text-zinc-200">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 grid gap-2">
        <button className="flex h-10 items-center gap-2 rounded border border-zinc-800 px-3 text-left text-sm hover:bg-zinc-900">
          <LayoutList size={16} />
          分镜表
        </button>
        <button className="flex h-10 items-center gap-2 rounded border border-zinc-800 px-3 text-left text-sm hover:bg-zinc-900">
          <Timer size={16} />
          任务队列
        </button>
      </div>
    </section>
  );
}
