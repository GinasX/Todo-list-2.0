import React from 'react';
import type { Todo } from '../types';
import { CloseIcon } from './icons';

interface InfoBoxProps {
  todo: Todo;
  onClose: () => void;
}

const InfoBox: React.FC<InfoBoxProps> = ({ todo, onClose }) => {
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border border-neutral-800 rounded-2xl p-4 bg-black relative animate-fade-in">
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 text-neutral-500 hover:text-white transition-colors"
        aria-label="Close info box"
      >
        <CloseIcon />
      </button>
      <h3 className="text-lg font-bold text-neutral-300 mb-3 pr-6 truncate" title={todo.text}>
        {todo.text}
      </h3>
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-neutral-500 font-semibold">Created:</p>
          <p className="text-neutral-200">{formatDate(todo.createdAt)}</p>
        </div>
        <div>
          <p className="text-neutral-500 font-semibold">Completed:</p>
          <p className="text-neutral-200">{formatDate(todo.completedAt)}</p>
        </div>
      </div>
    </div>
  );
};

// Add a simple fade-in animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default InfoBox;
