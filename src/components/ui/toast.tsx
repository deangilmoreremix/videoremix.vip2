import * as React from "react";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const toast = ({
  title,
  description,
  variant = "default",
}: ToastProps) => {
  const event = new CustomEvent("show-toast", {
    detail: { title, description, variant },
  });
  window.dispatchEvent(event);
};

export const Toaster = () => {
  const [toasts, setToasts] = React.useState<
    Array<ToastProps & { id: number }>
  >([]);

  React.useEffect(() => {
    const handleToast = (event: CustomEvent<ToastProps>) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { ...event.detail, id }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    window.addEventListener("show-toast" as any, handleToast as any);
    return () =>
      window.removeEventListener("show-toast" as any, handleToast as any);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[300px] rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-5 ${
            toast.variant === "destructive"
              ? "border-red-500 bg-red-50 text-red-900"
              : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && (
            <div className="text-sm mt-1">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
};
