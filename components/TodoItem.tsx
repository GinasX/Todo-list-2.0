import React, { useState, useEffect, useRef } from 'react';
import type { Todo } from '../types';
import { CheckIcon, EditIcon, DeleteIcon, InfoIcon } from './icons';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggleComplete: () => void;
  onUpdate: (id: number, newText: string) => void;
  onDelete: () => void;
  onShowInfo: (id: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onSetDragOverIndex: (index: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, index, onToggleComplete, onUpdate, onDelete, onShowInfo, onDragStart, onSetDragOverIndex, onDrop }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    } else {
        setEditText(todo.text);
    }
  }, [isEditing, todo.text]);

  const handleUpdate = () => {
    if (editText.trim() !== '') {
      onUpdate(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(todo.text);
    }
  };

  return (
    <div
      draggable
      onClick={onToggleComplete}
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnter={() => onSetDragOverIndex(index)}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`group relative flex items-center w-full bg-black border border-neutral-800 p-5 rounded-full my-2 cursor-pointer active:cursor-grabbing transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.02]`}
    >
      <button
        className="flex-shrink-0 w-8 h-8 border-2 border-neutral-700 rounded-full mr-5 flex items-center justify-center transition-colors duration-300 text-transparent group-hover:border-white group-hover:text-white"
        aria-label={`Mark ${todo.text} as complete`}
        onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
        }}
      >
        <CheckIcon />
      </button>
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleUpdate}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent text-white font-bold text-2xl focus:outline-none cursor-text"
        />
      ) : (
        <p className="font-bold text-2xl text-neutral-200 flex-grow" onClick={(e) => e.stopPropagation()}>{todo.text}</p>
      )}

      {!isEditing && (
        <div 
            className="ml-auto flex items-center space-x-1 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
        >
            <button className="p-2 rounded-full hover:text-white" onClick={() => setIsEditing(true)} aria-label="Edit task">
                <EditIcon />
            </button>
            <button className="p-2 rounded-full hover:text-white" onClick={() => onShowInfo(todo.id)} aria-label="Show task info">
                <InfoIcon />
            </button>
            <button className="p-2 rounded-full hover:text-red-500" onClick={onDelete} aria-label="Delete task">
                <DeleteIcon />
            </button>
        </div>
      )}
    </div>
  );
};

export default TodoItem;