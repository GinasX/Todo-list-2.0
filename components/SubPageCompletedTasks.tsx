import React from 'react';
import type { Page } from '../types';
import { CheckIcon, InfoIcon, DeleteIcon } from './icons';

interface SubPageCompletedTasksProps {
  page: Page;
  onRevertComplete: (id: number, pageId: string) => void;
  onDelete: (id: number, pageId: string) => void;
  onShowInfo: (id: number) => void;
}

const SubPageCompletedTasks: React.FC<SubPageCompletedTasksProps> = ({ page, onRevertComplete, onDelete, onShowInfo }) => {
  if (page.completedTodos.length === 0) return null;

  return (
    <div className="mt-4 border-t border-neutral-800 pt-4">
      <h3 className="text-md font-bold text-neutral-500 mb-2 px-2">{page.name}</h3>
      <div>
        {page.completedTodos.map(todo => (
          <div key={todo.id} className="group flex items-center w-full p-3 rounded-full my-1">
            <div className="flex items-center flex-grow cursor-pointer" onClick={() => onRevertComplete(todo.id, page.id)}>
              <div className="flex-shrink-0 w-6 h-6 border-2 border-white bg-white rounded-full mr-3 flex items-center justify-center text-black">
                <CheckIcon />
              </div>
              <p className="font-bold text-base text-neutral-500 line-through">{todo.text}</p>
            </div>
            <div className="ml-auto flex items-center space-x-1 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="p-2 rounded-full hover:text-white" onClick={() => onShowInfo(todo.id)} aria-label="Show task info"><InfoIcon /></button>
              <button className="p-2 rounded-full hover:text-red-500" onClick={() => onDelete(todo.id, page.id)} aria-label="Delete task"><DeleteIcon /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubPageCompletedTasks;
