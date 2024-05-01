import { createRef, useEffect, useState } from "npm:react";
import classNames from "npm:class-names";

export interface Props {
  onChangeTitle: (title: string) => void;
  onDestroy: () => void;
  onChangeCompleted: (completed: boolean) => void;
  title: string;
  completed: boolean;
}

export default function TodoItem(
  { onChangeTitle, onDestroy, onChangeCompleted, title, completed }: Props,
) {
  const [state, setState] = useState({ editing: false });
  const editField = createRef<HTMLInputElement>();

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.code === "Escape") {
      setState({ editing: false });
    } else if (event.code === "Enter") {
      finishEditing();
    }
  }

  function startEditing() {
    setState({ editing: true });

    if (editField.current) {
      const input = editField.current;
      input.value = title.trim();
    }
  }

  function finishEditing() {
    setState({ editing: false });

    if (editField.current) {
      const input = editField.current;
      const val = input.value.trim();

      if (val) {
        onChangeTitle(val);
      } else {
        onDestroy();
      }
    }
  }

  useEffect(() => {
    if (state.editing && editField.current) {
      const node = editField.current;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    }
  });

  return (
    <li
      className={classNames({
        completed: completed,
        editing: state.editing,
      })}
    >
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={completed}
          onChange={(ev) => onChangeCompleted(ev.target.checked)}
        />
        <label onDoubleClick={startEditing}>
          {title}
        </label>
        <button className="destroy" onClick={onDestroy} />
      </div>
      <input
        ref={editField}
        className="edit"
        onBlur={finishEditing}
        onKeyDown={handleKeyDown}
      />
    </li>
  );
}
