import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientOnly } from "../components/ClientOnly";
import { PropsWithChildren } from "react";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { getReplicache } from "../app-replicache";
import { getTodos } from "../model/Todo";
import { ReplicacheProvider } from "../components/ReplicacheProvider";
import { NoteEditor } from "../components/NoteEditor";

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

export default function Index() {
  return (
    <ClientOnly>
      {() => (
        <App>
          <NoteEditor />
        </App>
      )}
    </ClientOnly>
  );
}

export function HydrateFallback() {
  return null;
}
