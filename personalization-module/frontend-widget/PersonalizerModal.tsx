import React from 'react';

interface PersonalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function PersonalizerModal({ isOpen, onClose, title, children }: PersonalizerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button className="text-slate-600 hover:text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
