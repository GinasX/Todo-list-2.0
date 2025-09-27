import React, { useState, useCallback, FormEvent, useRef, useEffect, useMemo } from 'react';
import type { Todo, Page } from './types';
import TodoItem from './components/TodoItem';
import InfoBox from './components/InfoBox';
import PagesPanel from './components/PagesPanel';
import SubPageTasks from './components/SubPageTasks';
import SubPageCompletedTasks from './components/SubPageCompletedTasks';
import { PlusIcon, CheckIcon, InfoIcon, DeleteIcon, DoubleChevronLeftIcon } from './components/icons';
import { findPage, findTodo, updatePageRecursively } from './utils';

const initialPages: Page[] = [
  {
    id: '1',
    name: 'My Project',
    todos: [
        { id: 1, text: 'Plan main project phases', completed: false, createdAt: Date.now() - 200000, completedAt: null },
    ],
    completedTodos: [
        { id: 2, text: 'Setup project repository', completed: true, createdAt: Date.now() - 300000, completedAt: Date.now() - 250000 },
    ],
    children: [
        {
            id: '1-1',
            name: 'Phase 1: Research',
            todos: [
                { id: 11, text: 'Gather requirements', completed: false, createdAt: Date.now() - 100000, completedAt: null },
                { id: 12, text: 'Analyze competitors', completed: false, createdAt: Date.now() - 50000, completedAt: null },
            ],
            completedTodos: [
                { id: 13, text: 'Initial brainstorming session', completed: true, createdAt: Date.now() - 150000, completedAt: Date.now() - 120000 },
            ],
            children: [],
            isOpen: true
        },
        {
            id: '1-2',
            name: 'Phase 2: Design',
            todos: [
                 { id: 21, text: 'Create wireframes', completed: false, createdAt: Date.now(), completedAt: null },
            ],
            completedTodos: [],
            children: [],
            isOpen: true
        }
    ],
    isOpen: true,
  }
];

const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string>('1');
  const [newTodoText, setNewTodoText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [infoTodo, setInfoTodo] = useState<Todo | null>(null);
  const [isPagesPanelCollapsed, setIsPagesPanelCollapsed] = useState(false);
  const [isCompletedPanelCollapsed, setIsCompletedPanelCollapsed] = useState(false);
  const newTodoInputRef = useRef<HTMLInputElement>(null);

  const dragState = useRef<{ pageId: string; index: number } | null>(null);
  const dragOverState = useRef<{ pageId: string; index: number } | null>(null);
  
  const activePage = useMemo(() => findPage(pages, activePageId), [pages, activePageId]);

  // Global keydown listener to start adding a task
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) return;
      if (isAdding) return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsAdding(true);
        setNewTodoText(e.key);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isAdding]);

  useEffect(() => {
    if (isAdding && newTodoInputRef.current) {
        newTodoInputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTask = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim() === '' || !activePageId) return;
    
    const newTodo: Todo = {
      id: Date.now(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
    };

    setPages(currentPages => updatePageRecursively(currentPages, activePageId, page => ({
        ...page,
        todos: [newTodo, ...page.todos]
    })));

    setNewTodoText('');
    setIsAdding(false);
  }, [newTodoText, activePageId]);

  const handleToggleComplete = useCallback((id: number, pageId: string) => {
    if (!pageId) return;
    setPages(currentPages => updatePageRecursively(currentPages, pageId, page => {
        const todo = page.todos.find(t => t.id === id);
        if (todo) {
            const newCompletedTodo = { ...todo, completed: true, completedAt: Date.now() };
            if (infoTodo?.id === id) setInfoTodo(newCompletedTodo);
            return {
                ...page,
                todos: page.todos.filter(t => t.id !== id),
                completedTodos: [newCompletedTodo, ...page.completedTodos]
            };
        }
        return page;
    }));
  }, [infoTodo]);
  
  const handleRevertComplete = useCallback((id: number, pageId: string) => {
    if (!pageId) return;
    setPages(currentPages => updatePageRecursively(currentPages, pageId, page => {
        const todo = page.completedTodos.find(t => t.id === id);
        if (todo) {
            const newActiveTodo = { ...todo, completed: false, completedAt: null };
            if (infoTodo?.id === id) setInfoTodo(newActiveTodo);
            return {
                ...page,
                completedTodos: page.completedTodos.filter(t => t.id !== id),
                todos: [...page.todos, newActiveTodo]
            };
        }
        return page;
    }));
  }, [infoTodo]);

  const handleUpdate = useCallback((id: number, newText: string, pageId: string) => {
    if (!pageId) return;
     setPages(currentPages => updatePageRecursively(currentPages, pageId, page => ({
        ...page,
        todos: page.todos.map(todo => todo.id === id ? { ...todo, text: newText } : todo)
    })));
  }, []);
  
  const handleDelete = useCallback((id: number, pageId: string) => {
    if (!pageId) return;
    if (infoTodo?.id === id) setInfoTodo(null);
    setPages(currentPages => updatePageRecursively(currentPages, pageId, page => ({
        ...page,
        todos: page.todos.filter(t => t.id !== id),
        completedTodos: page.completedTodos.filter(t => t.id !== id)
    })));
  }, [infoTodo]);
  
  const handleShowInfo = useCallback((id: number) => {
    if (infoTodo?.id === id) {
      setInfoTodo(null);
      return;
    }
    const todo = findTodo(pages, id);
    if (todo) setInfoTodo(todo);
  }, [pages, infoTodo]);

  const handleDrop = (targetPageId: string) => {
    const dragged = dragState.current;
    const dropTarget = dragOverState.current;
    
    if (!dragged || !dropTarget || dragged.pageId !== targetPageId || dropTarget.pageId !== targetPageId) return;
    
    setPages(currentPages => updatePageRecursively(currentPages, targetPageId, page => {
        const todosCopy = [...page.todos];
        const draggedItemContent = todosCopy[dragged.index];
        todosCopy.splice(dragged.index, 1);
        todosCopy.splice(dropTarget.index, 0, draggedItemContent);
        return {...page, todos: todosCopy};
    }));
    
    dragState.current = null;
    dragOverState.current = null;
  };

  const leftPanelWidth = isPagesPanelCollapsed ? 64 : 320; // w-16 is 4rem = 64px, w-80 is 20rem = 320px
  const rightPanelWidth = isCompletedPanelCollapsed ? 64 : 384; // w-96 is 24rem = 384px
  const floatingButtonShift = (leftPanelWidth - rightPanelWidth) / 2;

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      <aside className={`flex-shrink-0 border-r border-neutral-800 p-4 flex flex-col transition-all duration-300 ease-in-out ${isPagesPanelCollapsed ? 'w-16' : 'w-80'}`}>
        <div className="flex items-center justify-end mb-2 flex-shrink-0">
          {!isPagesPanelCollapsed && <h2 className="text-lg font-bold text-neutral-400 px-2 mr-auto">Pages</h2>}
          <button 
            onClick={() => setIsPagesPanelCollapsed(!isPagesPanelCollapsed)}
            className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            aria-label={isPagesPanelCollapsed ? "Expand pages panel" : "Collapse pages panel"}
          >
            <DoubleChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isPagesPanelCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {!isPagesPanelCollapsed && (
          <div className="flex-grow overflow-y-auto hide-scrollbar">
            <PagesPanel pages={pages} setPages={setPages} activePageId={activePageId} setActivePageId={setActivePageId} />
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col items-center pt-16 pb-32 overflow-y-auto hide-scrollbar relative">
        <div className="w-full max-w-2xl px-4">
          <h1 className="text-4xl font-bold text-neutral-300 mb-8 text-center truncate" title={activePage?.name}>{activePage?.name || 'Select a Page'}</h1>
          
          {activePage ? (
            <div>
              {/* Active Page's Todos */}
              {activePage.todos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  index={index}
                  todo={todo}
                  onToggleComplete={() => handleToggleComplete(todo.id, activePage.id)}
                  onUpdate={(id, text) => handleUpdate(id, text, activePage.id)}
                  onDelete={() => handleDelete(todo.id, activePage.id)}
                  onShowInfo={handleShowInfo}
                  onDragStart={(e, i) => dragState.current = { pageId: activePage.id, index: i }}
                  onSetDragOverIndex={(i) => dragOverState.current = { pageId: activePage.id, index: i }}
                  onDrop={() => handleDrop(activePage.id)}
                />
              ))}
              {activePage.todos.length === 0 && activePage.children.length === 0 && (
                  <p className="text-center text-neutral-600 px-2 py-10">This page is empty. Add a task to get started.</p>
              )}
              {/* Sub-Pages' Todos */}
              {activePage.children.map(subPage => (
                <SubPageTasks 
                    key={subPage.id} 
                    page={subPage}
                    onToggleComplete={handleToggleComplete}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onShowInfo={handleShowInfo}
                    onDragStart={(e, i) => dragState.current = { pageId: subPage.id, index: i }}
                    onSetDragOverIndex={(i) => dragOverState.current = { pageId: subPage.id, index: i }}
                    onDrop={() => handleDrop(subPage.id)}
                />
              ))}
            </div>
          ) : (
             <p className="text-center text-neutral-600 px-2 py-10">Select a page from the left panel to view your tasks.</p>
          )}
        </div>
      </main>
      
      <aside className={`flex-shrink-0 border-l border-neutral-800 p-4 flex flex-col transition-all duration-300 ease-in-out ${isCompletedPanelCollapsed ? 'w-16' : 'w-96'}`}>
        <div className="flex items-center justify-start mb-2 flex-shrink-0">
            <button 
                onClick={() => setIsCompletedPanelCollapsed(!isCompletedPanelCollapsed)}
                className="p-2 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label={isCompletedPanelCollapsed ? "Expand completed panel" : "Collapse completed panel"}
            >
                <DoubleChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${!isCompletedPanelCollapsed ? 'rotate-180' : ''}`} />
            </button>
        </div>
        {!isCompletedPanelCollapsed && (
            <div className="flex-grow flex flex-col overflow-y-auto hide-scrollbar">
                {infoTodo && <InfoBox todo={infoTodo} onClose={() => setInfoTodo(null)} />}
                
                <div className="flex-grow flex flex-col mt-4">
                  <h2 className="text-lg font-bold text-neutral-400 mb-4 px-2 text-center">Completed</h2>
                  {activePage ? (
                    <>
                      {/* Active Page Completed */}
                      {activePage.completedTodos.length > 0 && (
                        <div>
                          {activePage.completedTodos.map(todo => (
                            <div key={todo.id} className="group flex items-center w-full p-3 rounded-full my-1">
                              <div className="flex items-center flex-grow cursor-pointer" onClick={() => handleRevertComplete(todo.id, activePage.id)}>
                                <div className="flex-shrink-0 w-6 h-6 border-2 border-white bg-white rounded-full mr-3 flex items-center justify-center text-black">
                                  <CheckIcon />
                                </div>
                                <p className="font-bold text-base text-neutral-500 line-through">{todo.text}</p>
                              </div>
                              <div className="ml-auto flex items-center space-x-1 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button className="p-2 rounded-full hover:text-white" onClick={() => handleShowInfo(todo.id)} aria-label="Show task info"><InfoIcon /></button>
                                <button className="p-2 rounded-full hover:text-red-500" onClick={() => handleDelete(todo.id, activePage.id)} aria-label="Delete task"><DeleteIcon /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sub-Pages Completed */}
                      {activePage.children.map(subPage => (
                          <SubPageCompletedTasks 
                              key={subPage.id}
                              page={subPage}
                              onRevertComplete={handleRevertComplete}
                              onDelete={handleDelete}
                              onShowInfo={handleShowInfo}
                          />
                      ))}

                      {/* Empty State */}
                      {activePage.completedTodos.length === 0 && activePage.children.every(c => c.completedTodos.length === 0) && (
                        <div className="flex-grow flex items-center justify-center">
                          <p className="text-center text-neutral-600 px-2">No completed tasks on this page or its sub-pages.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                      <p className="text-center text-neutral-600 px-2">Select a page to see completed tasks.</p>
                    </div>
                  )}
                </div>
            </div>
        )}
      </aside>

      <div className="fixed bottom-8 w-full max-w-2xl px-4 sm:px-0 left-1/2" style={{ transform: `translateX(calc(-50% + ${floatingButtonShift}px))` }}>
        {isAdding ? (
          <form onSubmit={handleAddTask} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsAdding(false); }} className="flex items-center w-full bg-black border border-neutral-700 p-3 rounded-full shadow-lg">
            <input ref={newTodoInputRef} type="text" value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setIsAdding(false); }} placeholder="Add a new task..." className="w-full bg-transparent text-white font-bold text-lg focus:outline-none ml-3 placeholder-neutral-500" />
            <button type="submit" className="flex-shrink-0 w-10 h-10 bg-white text-black hover:bg-neutral-300 rounded-full flex items-center justify-center transition-colors duration-300" aria-label="Add task"><PlusIcon /></button>
          </form>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={() => setIsAdding(true)} 
              disabled={!activePageId}
              className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:hover:scale-100" 
              aria-label="Add a new task"
            >
              <PlusIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;