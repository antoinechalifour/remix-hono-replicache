import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientOnly } from "../components/ClientOnly";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { Replicache, TEST_LICENSE_KEY, WriteTransaction } from "replicache";
import { useSubscribe } from "replicache-react";

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
  const defaultTodos = await replicache.query((tx) =>
    tx.scan<Todo>({ prefix: "todos/" }).values().toArray(),
  );
  return { ...loaderData, defaultTodos };
};

clientLoader.hydrate = true;

type Todo = {
  id: string;
  title: string;
  done: boolean;
};

const raise = (message: string) => {
  throw new Error(message);
};

const getTodo = async (tx: WriteTransaction, id: string): Promise<Todo> => {
  const todo = await tx.get<Todo>(`todos/${id}`);
  return todo ?? raise(`Todo not found ${id}`);
};

const saveTodo = async (tx: WriteTransaction, todo: Todo) => {
  await tx.set(`todos/${todo.id}`, todo);
};

const deleteTodo = async (tx: WriteTransaction, id: string) => {
  return tx.del(`todos/${id}`);
};

const MUTATORS = {
  async create(tx: WriteTransaction, input: { id: string; title: string }) {
    await saveTodo(tx, {
      id: input.id,
      title: input.title,
      done: false,
    });
  },
  async delete(tx: WriteTransaction, input: { id: string }) {
    await deleteTodo(tx, input.id);
  },
  async check(tx: WriteTransaction, input: { id: string }) {
    const todo = await getTodo(tx, input.id);
    await saveTodo(tx, {
      ...todo,
      done: true,
    });
  },
  async uncheck(tx: WriteTransaction, input: { id: string }) {
    const todo = await getTodo(tx, input.id);
    await saveTodo(tx, {
      ...todo,
      done: false,
    });
  },
};

const replicacheContext = createContext<Replicache<typeof MUTATORS> | null>(
  null,
);
const useReplicache = () =>
  useContext(replicacheContext) ?? raise("Missing provider");

const cache = new Map<string, Replicache<typeof MUTATORS>>();

const getReplicache = (userId: string) => {
  const fromCache = cache.get(userId);
  if (fromCache != null) return fromCache;
  const fresh = new Replicache({
    name: userId,
    licenseKey: TEST_LICENSE_KEY,
    mutators: MUTATORS,
    pullURL: "/replicache/pull",
    pushURL: "/replicache/push",
  });
  cache.set(userId, fresh);
  return fresh;
};

const App = ({ children }: PropsWithChildren) => {
  const { user } = useLoaderData<typeof clientLoader>();
  const replicache = useMemo(() => getReplicache(user.id), [user.id]);

  return (
    <replicacheContext.Provider value={replicache}>
      {children}
    </replicacheContext.Provider>
  );
};

const TodoList = () => {
  const replicache = useReplicache();
  const { defaultTodos } = useLoaderData<typeof clientLoader>();
  const todos = useSubscribe(
    replicache,
    (tx) => tx.scan<Todo>({ prefix: "todos/" }).values().toArray(),
    { default: defaultTodos },
  );
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
