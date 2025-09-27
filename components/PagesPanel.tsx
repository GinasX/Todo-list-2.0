import React, { useState } from 'react';
import type { Page } from '../types';
import { ChevronRightIcon, PlusIcon, EditIcon, DeleteIcon } from './icons';
import { updatePageRecursively, deletePageRecursively, findPageAndParent, findPage } from '../utils';

interface PagesPanelProps {
    pages: Page[];
    setPages: React.Dispatch<React.SetStateAction<Page[]>>;
    activePageId: string | null;
    setActivePageId: (id: string) => void;
    handleMovePage: (draggedId: string, targetId: string) => void;
}

const PageItem: React.FC<{ 
    page: Page; 
    level: number;
} & PagesPanelProps> = ({ page, level, pages, setPages, activePageId, setActivePageId, handleMovePage }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(page.name);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleRename = () => {
        if(editText.trim()) {
            setPages(current => updatePageRecursively(current, page.id, p => ({...p, name: editText.trim()})));
        }
        setIsEditing(false);
    };

    const handleAddSubPage = () => {
        const newPage: Page = {
            id: Date.now().toString(),
            name: 'New Sub-page',
            todos: [],
            completedTodos: [],
            children: [],
            isOpen: true
        };
        setPages(current => updatePageRecursively(current, page.id, p => ({...p, children: [...p.children, newPage], isOpen: true})));
    };

    const handleDelete = () => {
        setPages(current => deletePageRecursively(current, page.id));
        if (activePageId === page.id) {
            setActivePageId(pages[0]?.id || null);
        }
    };

    const toggleOpen = () => {
        setPages(current => updatePageRecursively(current, page.id, p => ({...p, isOpen: !p.isOpen})));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('pageId', page.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const draggedPageId = e.dataTransfer.getData('pageId');
        const targetPageId = page.id;
        if (draggedPageId && draggedPageId !== targetPageId) {
            handleMovePage(draggedPageId, targetPageId);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setIsDragOver(false);
    };

    return (
        <div>
            <div 
                draggable
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`group flex items-center p-2 rounded-lg my-1 cursor-pointer active:cursor-grabbing transition-colors relative
                    ${activePageId === page.id ? 'bg-neutral-700' : 'hover:bg-neutral-800'}`}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                onClick={() => setActivePageId(page.id)}
            >
                {isDragOver && (
                    <div className="absolute top-[-2px] left-0 right-0 h-1 bg-white rounded-full pointer-events-none" />
                )}
                <button onClick={(e) => { e.stopPropagation(); toggleOpen(); }} className={`mr-1 p-1 rounded-md hover:bg-neutral-600 transition-transform ${page.isOpen ? 'rotate-90' : ''} ${page.children.length === 0 ? 'opacity-0 cursor-default' : ''}`} disabled={page.children.length === 0}>
                    <ChevronRightIcon />
                </button>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={e => e.key === 'Enter' && handleRename()}
                        className="bg-transparent border-b border-neutral-500 w-full focus:outline-none"
                        autoFocus
                    />
                ) : (
                    <span className="flex-grow truncate" onDoubleClick={() => setIsEditing(true)}>{page.name}</span>
                )}
                {!isEditing && (
                    <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 text-neutral-400">
                        <button className="p-1 rounded-md hover:bg-neutral-600 hover:text-white" onClick={e => {e.stopPropagation(); handleAddSubPage()}} title="Add sub-page"><PlusIcon/></button>
                        <button className="p-1 rounded-md hover:bg-neutral-600 hover:text-white" onClick={e => {e.stopPropagation(); setIsEditing(true)}} title="Rename"><EditIcon/></button>
                        <button className="p-1 rounded-md hover:bg-neutral-600 hover:text-red-500" onClick={e => {e.stopPropagation(); handleDelete()}} title="Delete"><DeleteIcon/></button>
                    </div>
                )}
            </div>
            {page.isOpen && page.children.map(child => (
                <PageItem key={child.id} page={child} level={level + 1} {...{pages, setPages, activePageId, setActivePageId, handleMovePage}} />
            ))}
        </div>
    );
}

const PagesPanel: React.FC<Omit<PagesPanelProps, 'handleMovePage'>> = (props) => {
    const { pages, setPages } = props;

    const handleAddPage = () => {
        const newPage: Page = {
            id: Date.now().toString(),
            name: 'New Page',
            todos: [],
            completedTodos: [],
            children: [],
            isOpen: true,
        };
        setPages(current => [...current, newPage]);
    };

    const handleMovePage = (draggedId: string, targetId: string) => {
        setPages(currentPages => {
            // Deep copy to avoid mutation issues with nested objects
            const pagesCopy = JSON.parse(JSON.stringify(currentPages));

            // Prevent dropping a page into one of its own descendants
            const draggedNodeInfo = findPageAndParent(pagesCopy, draggedId);
            if (draggedNodeInfo) {
                const isDescendant = findPage([draggedNodeInfo.page], targetId);
                if (isDescendant) {
                    console.warn("Cannot move a page into one of its own descendants.");
                    return currentPages; // Abort move
                }
            }

            const draggedInfo = findPageAndParent(pagesCopy, draggedId);
            const targetInfo = findPageAndParent(pagesCopy, targetId);

            // Proceed only if both pages are found and belong to the same parent (reordering, not nesting)
            if (!draggedInfo || !targetInfo || draggedInfo.parent?.id !== targetInfo.parent?.id) {
                return currentPages;
            }

            // 1. Remove dragged page from its original location
            const sourceList = draggedInfo.parent ? draggedInfo.parent.children : pagesCopy;
            const draggedItemIndex = sourceList.findIndex(p => p.id === draggedId);
            const [draggedItem] = sourceList.splice(draggedItemIndex, 1);

            if (!draggedItem) return currentPages; // Should not happen

            // 2. Insert it before the target in the same list
            const targetItemIndex = sourceList.findIndex(p => p.id === targetId);
            sourceList.splice(targetItemIndex, 0, draggedItem);

            return pagesCopy;
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                {pages.map(page => <PageItem key={page.id} page={page} level={0} {...props} handleMovePage={handleMovePage} />)}
            </div>
            <button onClick={handleAddPage} className="w-full mt-2 p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors flex items-center justify-center flex-shrink-0">
                <PlusIcon /> <span className="ml-2">Add New Page</span>
            </button>
        </div>
    );
};

export default PagesPanel;