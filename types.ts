export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

export interface Page {
  id: string;
  name: string;
  todos: Todo[];
  completedTodos: Todo[];
  children: Page[];
  isOpen?: boolean; // For UI state to track if folder is open
}
