import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  ClientLoaderFunctionArgs,
  Outlet,
  redirect,
  useLoaderData,
} from "@remix-run/react";
import { getReplicache } from "../../app-replicache";
import { ClientOnly } from "../../components/ClientOnly";
import { ReplicacheProvider } from "../../components/ReplicacheProvider";
import { getNotes } from "../../model/Note";
import { DeleteNoteButton } from "./components/DeleteNoteButton";
import { NotesList } from "./components/NotesList";

export const meta: MetaFunction = () => {
  return [{ title: "Notes" }];
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

export default function Index() {
  const { user } = useLoaderData<typeof clientLoader>();
  return (
    <ClientOnly>
      {() => (
        <ReplicacheProvider userId={user.id}>
          <div className="flex items-start min-h-screen">
            <nav className="grow shrink-0 max-w-[350px] bg-white h-screen sticky top-0 overflow-hidden flex flex-col">
              <header className="bg-gray-100 sticky top-0 z-10 p-6 flex justify-end border-slate-300 border-r-2">
                <DeleteNoteButton />
              </header>
              <div className="grow border-r-2 border-slate-200 overflow-y-auto">
                <NotesList />
              </div>
            </nav>
            <Outlet />
          </div>
        </ReplicacheProvider>
      )}
    </ClientOnly>
  );
}

export function HydrateFallback() {
  return null;
}
