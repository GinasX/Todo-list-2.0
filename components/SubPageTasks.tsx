import React, { useState } from 'react';
import type { Page } from '../types';
import TodoItem from './TodoItem';
import { ChevronRightIcon } from './icons';

interface SubPageTasksProps {
  page: Page;
  onToggleComplete: (id: number, pageId: string) => void;
  onUpdate: (id: number, newText: string, pageId: string) => void;
  onDelete: (id: number, pageId: string) => void;
  onShowInfo: (id: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onSetDragOverIndex: (index: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const SubPageTasks: React.FC<SubPageTasksProps> = ({ page, onToggleComplete, onUpdate, onDelete, onShowInfo, onDragStart, onSetDragOverIndex, onDrop }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (page.todos.length === 0) return null;

  return (
    <div className="mt-8 border-t border-neutral-800 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full text-left text-xl font-bold text-neutral-400 hover:text-white transition-colors mb-2 p-2 rounded-lg hover:bg-neutral-900"
      >
        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''} mr-2`}>
          <ChevronRightIcon />
        </span>
        {page.name}
      </button>
      {isOpen && (
        <div className="pl-4">
          {page.todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              index={index}
              todo={todo}
              onToggleComplete={() => onToggleComplete(todo.id, page.id)}
              onUpdate={(id, text) => onUpdate(id, text, page.id)}
              onDelete={() => onDelete(todo.id, page.id)}
              onShowInfo={onShowInfo}
              onDragStart={onDragStart}
              onSetDragOverIndex={onSetDragOverIndex}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubPageTasks;