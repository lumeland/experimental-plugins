export interface Props {
  onCreate: (name: string) => void;
}

export default function Header({ onCreate }: Props) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const input = event.target as HTMLInputElement;

    if (event.code == "Escape") {
      input.value = "";
      input.blur();
      return;
    }

    if (event.code !== "Enter") {
      return;
    }

    event.preventDefault();

    const val = input.value.trim();

    if (val) {
      onCreate(val);
    }
    input.value = "";
  }

  return (
    <header className="header">
      <h1>To-Dos</h1>
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        type="text"
        onKeyDown={handleKeyDown}
        autoFocus={true}
      />
    </header>
  );
}
