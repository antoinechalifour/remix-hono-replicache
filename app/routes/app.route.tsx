import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientOnly } from "../components/ClientOnly";
import { PropsWithChildren } from "react";
import {
  ClientLoaderFunctionArgs,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { getReplicache } from "../app-replicache";
import {
  ReplicacheProvider,
  useReplicache,
} from "../components/ReplicacheProvider";
import { getNotes } from "../model/Note";
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
  const defaultNotes = await replicache.query(getNotes);
  return { ...loaderData, defaultNotes };
};

clientLoader.hydrate = true;

const App = ({ children }: PropsWithChildren) => {
  const { user } = useLoaderData<typeof clientLoader>();

  return <ReplicacheProvider userId={user.id}>{children}</ReplicacheProvider>;
};

const NotesList = () => {
  const { defaultNotes } = useLoaderData<typeof clientLoader>();
  const replicache = useReplicache();
  const notes = useSubscribe(replicache, getNotes, { default: defaultNotes });
  const navigate = useNavigate();

  return (
    <section className="grow max-w-[280px] bg-white border-r border-slate-200 h-screen">
      <div className="p-1.5">
        <button
          type="button"
          className="p-1.5 block w-full text-center rounded bg-slate-200 font-semibold"
          onClick={async () => {
            const noteId = crypto.randomUUID();
            await replicache.mutate.createNote({
              id: noteId,
              title: "Untitled note...",
            });
            navigate(`/notes/${noteId}`);
          }}
        >
          Create a note
        </button>
      </div>
      <ol className="p-3 border-t border-slate-200">
        {notes.map((note) => (
          <li key={note.id}>
            <NavLink
              to={`notes/${note.id}`}
              className="flex flex-col overflow-hidden"
            >
              <span className="font-bold">{note.title}</span>
              <span className="line-clamp-1 flex gap-2 whitespace-nowrap truncate">
                <span>{note.createdAt}</span>
                <span>{note.title}</span>
              </span>
            </NavLink>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default function Index() {
  return (
    <ClientOnly>
      {() => (
        <App>
          <main className="flex items-start min-h-screen">
            <NotesList />
            <Outlet />
          </main>
        </App>
      )}
    </ClientOnly>
  );
}

export function HydrateFallback() {
  return null;
}