import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientOnly } from "../components/ClientOnly";
import { PropsWithChildren } from "react";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { getReplicache } from "../app-replicache";
import { useSubscribe } from "replicache-react";
import { getTodos } from "../model/Todo";
import {
  ReplicacheProvider,
  useReplicache,
} from "../components/ReplicacheProvider";

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    user: {
      id: string;
      name: string;
    };
  }
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = (args: LoaderFunctionArgs) => {
  return { user: args.context.user };
};

export const clientLoader = async (args: ClientLoaderFunctionArgs) => {
  const loaderData = await args.serverLoader<typeof loader>();
  const replicache = getReplicache(loaderData.user.id);
  const defaultTodos = await replicache.query(getTodos);
  return { ...loaderData, defaultTodos };
};

clientLoader.hydrate = true;

const App = ({ children }: PropsWithChildren) => {
  const { user } = useLoaderData<typeof clientLoader>();

  return <ReplicacheProvider userId={user.id}>{children}</ReplicacheProvider>;
};

const TodoList = () => {
  const replicache = useReplicache();
  const { defaultTodos } = useLoaderData<typeof clientLoader>();
  const todos = useSubscribe(replicache, getTodos, { default: defaultTodos });
  console.log("default:", defaultTodos, "todos", todos);

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
                  replicache.mutate.check({ id: todo.id });
                else replicache.mutate.uncheck({ id: todo.id });
              }}
            />

            <button
              type="button"
              onClick={() => replicache.mutate.delete({ id: todo.id })}
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
          replicache.mutate.create({
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

export default function Index() {
  return (
    <ClientOnly>
      {() => (
        <App>
          <TodoList />
        </App>
      )}
    </ClientOnly>
  );
}

export function HydrateFallback() {
  return null;
}
