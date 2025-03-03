import { useEffect, useState } from "npm:react";
import TodoHeader from "./header.tsx";
import TodoFooter from "./footer.tsx";
import TodoItem from "./todo_item.tsx";

const ALL_TODOS = "all";
const ACTIVE_TODOS = "active";
const COMPLETED_TODOS = "completed";

export interface Todo {
  title: string;
  completed: boolean;
}

export interface State {
  filter: "all" | "active" | "completed";
  todos: Todo[];
}

export default function App() {
  const namespace = "react-todos";

  const [state, setState] = useState<State>({
    filter: ALL_TODOS,
    todos: [],
  });

  useEffect(() => {
    const todos = readStore(namespace);
    if (todos) {
      setState({
        ...state,
        todos,
      });
    }
  }, []);

  useEffect(() => {
    writeStore(namespace, state.todos);
  }, [state.todos]);

  const activeTodoCount = state.todos.filter((todo) => !todo.completed).length;
  const completedCount = state.todos.length - activeTodoCount;
  const todos = state.todos.filter((todo) => {
    if (state.filter === ALL_TODOS) {
      return true;
    }

    return (state.filter === COMPLETED_TODOS)
      ? todo.completed
      : !todo.completed;
  });

  function onCreate(title: string) {
    const todo: Todo = {
      title,
      completed: false,
    };

    setState({
      ...state,
      todos: [...state.todos, todo],
    });
  }

  function onToggleAll(completed: boolean) {
    setState({
      ...state,
      todos: state.todos.map((t) => ({ ...t, completed })),
    });
  }

  function onDestroy(todo: Todo) {
    setState({
      ...state,
      todos: state.todos.filter((t) => t !== todo),
    });
  }

  function onChangeCompleted(todo: Todo, completed: boolean) {
    setState({
      ...state,
      todos: state.todos.map((t) => (t !== todo ? t : { ...t, completed })),
    });
  }

  function onChangeTitle(todo: Todo, title: string) {
    setState({
      ...state,
      todos: state.todos.map((t) => (t !== todo ? t : { ...t, title })),
    });
  }

  function onClearCompleted() {
    setState({
      ...state,
      todos: state.todos.filter((t) => !t.completed),
    });
  }

  return (
    <div>
      <TodoHeader onCreate={(val: string) => onCreate(val)} />

      {!!todos.length && (
        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            onChange={(ev) => onToggleAll(ev.target.checked)}
            checked={activeTodoCount === 0}
          />
          <label htmlFor="toggle-all" />
          <ul className="todo-list">
            {todos.map((todo, index) => (
              <TodoItem
                key={index}
                title={todo.title}
                completed={todo.completed}
                onChangeTitle={(title) => onChangeTitle(todo, title)}
                onChangeCompleted={(completed) =>
                  onChangeCompleted(todo, completed)}
                onDestroy={() => onDestroy(todo)}
              />
            ))}
          </ul>
        </section>
      )}

      {!!(activeTodoCount || completedCount) && (
        <TodoFooter
          count={activeTodoCount}
          completedCount={completedCount}
          filter={state.filter}
          onChangeFilter={(filter) => setState({ ...state, filter })}
          onClearCompleted={onClearCompleted}
        />
      )}
    </div>
  );
}

function readStore(namespace: string): Todo[] {
  try {
    const store = localStorage.getItem(namespace);
    return (store && JSON.parse(store)) || [];
  } catch {
    return [];
  }
}

function writeStore(namespace: string, data: Todo[]): void {
  try {
    localStorage.setItem(namespace, JSON.stringify(data));
  } catch {
    // ignore
  }
}
