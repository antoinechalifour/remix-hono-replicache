import type { LoaderFunctionArgs } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import { useSubscribe } from "replicache-react";
import { getReplicache } from "../app-replicache";
import { NoteEditor } from "../components/NoteEditor";
import { useReplicache } from "../components/ReplicacheProvider";
import { getNote } from "../model/Note";

export const loader = (args: LoaderFunctionArgs) => {
  return { user: args.context.user };
};

export const clientLoader = async (args: ClientLoaderFunctionArgs) => {
  const loaderData = await args.serverLoader<typeof loader>();
  const noteId = args.params.noteId;
  const replicache = getReplicache(loaderData.user.id);
  const defaultNote = await replicache.query((tx) => getNote(tx, noteId));
  return { ...loaderData, noteId, defaultNote };
};

clientLoader.hydrate = true;

export default function NoteDetailRoute() {
  const { defaultNote, noteId } = useLoaderData<typeof clientLoader>();
  const replicache = useReplicache();
  const note = useSubscribe(replicache, (tx) => getNote(tx, noteId), {
    dependencies: [noteId],
    default: defaultNote,
  });

  return (
    <div className="flex flex-col gap-2 grow px-8 py-2" key={note.id}>
      <header className="text-center text-sm">
        {DateTime.fromISO(note.updatedAt).toLocaleString(
          DateTime.DATETIME_FULL,
        )}
      </header>
      <input
        type="text"
        defaultValue={note.title}
        className="focus:outline-none"
        onChange={(e) =>
          replicache.mutate.updateNote({ id: noteId, title: e.target.value })
        }
      />

      <NoteEditor
        content={note.content}
        onChange={(content) =>
          replicache.mutate.updateNote({
            id: noteId,
            content,
          })
        }
      />
    </div>
  );
}
