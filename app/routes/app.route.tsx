import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  ClientLoaderFunctionArgs,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigate,
  redirect,
} from "@remix-run/react";
import { PenSquareIcon, TrashIcon } from "lucide-react";
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

  return (
    <ol className="p-3 border-t border-slate-200">
      {notes.map((note) => (
        <li key={note.id}>
          <NavLink
            to={`notes/${note.id}`}
            className="flex flex-col overflow-hidden nav-active:bg-gray-100 rounded-md px-4 py-2"
          >
            <span className="font-bold line-clamp-1 text-sm">{note.title}</span>
            <span className="line-clamp-1 flex gap-2 whitespace-nowrap truncate text-xs">
              <span>{DateTime.fromISO(note.createdAt).toLocaleString()}</span>
              <span>{note.title}</span>
            </span>
          </NavLink>
        </li>
      ))}
    </ol>
  );
};

const CreateNoteButton = () => {
  const replicache = useReplicache();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="-m-2 p-2 block bg-transparent transition-colors rounded hover:bg-slate-200"
      onClick={async () => {
        const noteId = crypto.randomUUID();
        await replicache.mutate.createNote({
          id: noteId,
          title: "Untitled note...",
        });
        navigate(`/notes/${noteId}`);
      }}
    >
      <PenSquareIcon className="size-4" />
    </button>
  );
};

const DeleteNoteButton = () => {
  const replicache = useReplicache();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="-m-2 p-2 block bg-transparent transition-colors rounded hover:bg-slate-200"
      onClick={async () => {
        const noteId = crypto.randomUUID();
        await replicache.mutate.createNote({
          id: noteId,
          title: "Untitled note...",
        });
        navigate(`/notes/${noteId}`);
      }}
    >
      <TrashIcon className="size-4" />
    </button>
  );
};

export default function Index() {
  return (
    <ClientOnly>
      {() => (
        <App>
          <div className="flex items-start min-h-screen">
            <nav className="grow shrink-0 max-w-[350px] bg-white h-screen sticky top-0 overflow-hidden flex flex-col">
              <header className="bg-gray-100 sticky top-0 z-10 p-6 flex justify-end border-slate-300 border-r-2">
                <DeleteNoteButton />
              </header>
              <div className="grow border-r-2 border-slate-200 overflow-y-auto">
                <NotesList />
              </div>
            </nav>
            <main className="grow flex flex-col min-h-screen">
              <header className="bg-gray-100 sticky top-0 z-10 p-6">
                <CreateNoteButton />
              </header>
              <Outlet />
            </main>
          </div>
        </App>
      )}
    </ClientOnly>
  );
}

export function HydrateFallback() {
  return null;
}
