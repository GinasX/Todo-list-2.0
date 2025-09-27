import type { Page, Todo } from './types';

export const findPage = (pages: Page[], pageId: string | null): Page | null => {
    if (!pageId) return null;
    for (const page of pages) {
        if (page.id === pageId) return page;
        const foundInChildren = findPage(page.children, pageId);
        if (foundInChildren) return foundInChildren;
    }
    return null;
};

export const findTodo = (pages: Page[], todoId: number): Todo | null => {
    for (const page of pages) {
        const todo = page.todos.find(t => t.id === todoId) || page.completedTodos.find(t => t.id === todoId);
        if (todo) return todo;
        const foundInChildren = findTodo(page.children, todoId);
        if (foundInChildren) return foundInChildren;
    }
    return null;
}

export const updatePageRecursively = (pages: Page[], pageId: string, updateFn: (page: Page) => Page): Page[] => {
    return pages.map(p => {
        if (p.id === pageId) {
            return updateFn(p);
        }
        if (p.children && p.children.length > 0) {
            return { ...p, children: updatePageRecursively(p.children, pageId, updateFn) };
        }
        return p;
    });
};

export const deletePageRecursively = (pages: Page[], pageId: string): Page[] => {
    const newPages: Page[] = [];
    for (const page of pages) {
        if (page.id === pageId) {
            continue; // Skip this page
        }
        const newChildren = page.children ? deletePageRecursively(page.children, pageId) : [];
        newPages.push({ ...page, children: newChildren });
    }
    return newPages;
};

export const findPageAndParent = (
    pages: Page[],
    pageId: string,
    parent: Page | null = null
): { page: Page; parent: Page | null } | null => {
    for (const page of pages) {
        if (page.id === pageId) {
            return { page, parent };
        }
        if (page.children && page.children.length > 0) {
            const found = findPageAndParent(page.children, pageId, page);
            if (found) {
                return found;
            }
        }
    }
    return null;
};