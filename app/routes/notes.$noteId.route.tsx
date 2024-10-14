import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getReplicache } from "../app-replicache";
import { getNote } from "../model/Note";
import { useReplicache } from "../components/ReplicacheProvider";
import { useSubscribe } from "replicache-react";
import { NoteEditor } from "../components/NoteEditor";

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
    <div className="flex flex-col gap-2" key={note.id}>
      <input
        type="text"
        defaultValue={note.title}
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
