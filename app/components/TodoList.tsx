import { useReplicache } from "./ReplicacheProvider";
import { useLoaderData } from "@remix-run/react";
import { useSubscribe } from "replicache-react";
import { getTodos } from "../model/Todo";
import { clientLoader } from "../routes/_index";

export const TodoList = () => {
  const replicache = useReplicache();
  const { defaultTodos } = useLoaderData<typeof clientLoader>();
  const todos = useSubscribe(replicache, getTodos, { default: defaultTodos });

  return (
    <div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title}

            <input
              type="checkbox"
              defaultChecked={todo.done}
              onChange={(e) => {
                if (e.currentTarget.checked)
                  replicache.mutate.checkTodo({ id: todo.id });
                else replicache.mutate.uncheckTodo({ id: todo.id });
              }}
            />

            <button
              type="button"
              onClick={() => replicache.mutate.deleteTodo({ id: todo.id })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          replicache.mutate.createTodo({
            id: crypto.randomUUID(),
            title: formData.get("todo") as string,
          });
        }}
      >
        <input name="todo" type="text" placeholder="New todo..." />
        <button type="submit">Add</button>
      </form>
    </div>
  );
};
