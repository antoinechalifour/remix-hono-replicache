import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  ClientLoaderFunctionArgs,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigate,
  redirect,
} from "@remix-run/react";
import { DateTime } from "luxon";
import { PropsWithChildren } from "react";
import { useSubscribe } from "replicache-react";
import { getReplicache } from "../app-replicache";
import { ClientOnly } from "../components/ClientOnly";
import {
  ReplicacheProvider,
  useReplicache,
} from "../components/ReplicacheProvider";
import { getNotes } from "../model/Note";

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

  if (new URL(args.request.url).pathname === "/") {
    if (defaultNotes.length > 0) {
      throw redirect(`/notes/${defaultNotes[0].id}`);
    }
  }

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
              className="flex flex-col overflow-hidden nav-active:bg-gray-100 rounded-md px-4 py-2"
            >
              <span className="font-bold line-clamp-1 text-sm">
                {note.title}
              </span>
              <span className="line-clamp-1 flex gap-2 whitespace-nowrap truncate text-xs">
                <span>{DateTime.fromISO(note.createdAt).toLocaleString()}</span>
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
