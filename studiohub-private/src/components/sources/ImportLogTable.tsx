import type { ImportLog } from "@/types/studiohub";

interface ImportLogTableProps {
  logs: ImportLog[];
}

export function ImportLogTable({ logs }: ImportLogTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Found</th>
              <th className="px-4 py-3">Imported</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                  {log.createdAt}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-white">
                  {log.importType}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">
                  {log.status}
                </td>
                <td className="px-4 py-4 text-slate-300">{log.itemsFound}</td>
                <td className="px-4 py-4 text-slate-300">{log.itemsImported}</td>
                <td className="min-w-72 px-4 py-4 text-slate-300">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
