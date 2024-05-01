import classNames from "npm:class-names";

const ALL_TODOS = "all";
const ACTIVE_TODOS = "active";
const COMPLETED_TODOS = "completed";

export interface Props {
  count: number;
  filter: "all" | "active" | "completed";
  completedCount: number;
  onClearCompleted: () => void;
  onChangeFilter: (filter: "all" | "active" | "completed") => void;
}

export default function Footer(
  { count, onClearCompleted, filter, completedCount, onChangeFilter }: Props,
) {
  return (
    <footer className="footer">
      <span className="todo-count">
        <strong>{count}</strong> {count === 1 ? "item" : "items"} left
      </span>
      <ul className="filters">
        <li>
          <button
            onClick={() => onChangeFilter(ALL_TODOS)}
            className={classNames({ selected: filter === ALL_TODOS })}
          >
            All
          </button>
        </li>
        <li>
          <button
            onClick={() => onChangeFilter(ACTIVE_TODOS)}
            className={classNames({ selected: filter === ACTIVE_TODOS })}
          >
            Active
          </button>
        </li>
        <li>
          <button
            onClick={() => onChangeFilter(COMPLETED_TODOS)}
            className={classNames({
              selected: filter === COMPLETED_TODOS,
            })}
          >
            Completed
          </button>
        </li>
      </ul>
      {!!(completedCount > 0) && (
        <button
          className="clear-completed"
          onClick={onClearCompleted}
        >
          Clear completed
        </button>
      )}
    </footer>
  );
}
