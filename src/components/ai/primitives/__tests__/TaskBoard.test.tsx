import { render, screen } from "@testing-library/react";
import { TaskBoard } from "../TaskBoard";

describe("TaskBoard", () => {
  const sampleTasks = [
    { title: "Task 1", status: "todo" },
    { title: "Task 2", status: "in-progress" },
    { title: "Task 3", status: "completed" },
  ];

  it("renders tasks in kanban view by default", () => {
    render(<TaskBoard data={sampleTasks} />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("Task 3")).toBeInTheDocument();
  });

  it("renders tasks in table view when specified", () => {
    render(<TaskBoard data={sampleTasks} view="table" />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("Task 3")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Assignee")).toBeInTheDocument();
  });

  it("shows task descriptions when present", () => {
    const tasksWithDesc = [{ title: "Task", description: "Do the thing", status: "todo" }];
    render(<TaskBoard data={tasksWithDesc} />);
    expect(screen.getByText("Do the thing")).toBeInTheDocument();
  });

  it("shows task assignees when present", () => {
    const tasksWithAssignee = [{ title: "Task", assignee: "Alice", status: "todo" }];
    render(<TaskBoard data={tasksWithAssignee} />);
    expect(screen.getByText("👤 Alice")).toBeInTheDocument();
  });

  it("shows status labels in table view", () => {
    render(<TaskBoard data={sampleTasks} view="table" />);
    expect(screen.getByText("todo")).toBeInTheDocument();
    expect(screen.getByText("in-progress")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("handles empty data", () => {
    render(<TaskBoard data={[]} />);
    expect(screen.queryByText("Task")).toBeNull();
  });
});