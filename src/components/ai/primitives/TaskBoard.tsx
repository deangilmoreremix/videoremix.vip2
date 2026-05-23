import React from "react";
import { LayoutGrid, List } from "lucide-react";

interface Task {
  title: string;
  description?: string;
  status?: string;
  assignee?: string;
  [key: string]: unknown;
}

interface TaskBoardProps {
  data: Task[];
  view?: "kanban" | "table";
}

const STATUS_COLORS: Record<string, string> = {
  "in-progress": "bg-blue-900/50 text-blue-400",
  completed: "bg-green-900/50 text-green-400",
  "todo": "bg-gray-700/50 text-gray-400",
  pending: "bg-yellow-900/50 text-yellow-400",
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  data,
  view = "kanban",
}) => {
  const statuses = [...new Set(data.map((t) => t.status || "todo"))];
  const defaultStatuses = ["todo", "in-progress", "completed"];

  if (view === "table") {
    return (
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800">
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Title</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Description</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-gray-400 font-medium">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {data.map((task, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-100">{task.title}</td>
                <td className="px-4 py-3 text-gray-400">{task.description || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[task.status || "todo"]}`}>
                    {task.status || "todo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{task.assignee || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const columns = statuses.length > 0 ? statuses : defaultStatuses;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((status) => {
        const tasks = data.filter((t) => (t.status || "todo") === status);
        return (
          <div key={status} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.todo}`}>
                {status}
              </span>
              <span className="text-xs text-gray-500">{tasks.length}</span>
            </div>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <div className="text-sm font-medium text-gray-100 mb-1">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-gray-400 line-clamp-2">{task.description}</div>
                  )}
                  {task.assignee && (
                    <div className="mt-2 text-xs text-gray-500">👤 {task.assignee}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};