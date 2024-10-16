import type { LoaderFunctionArgs } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { useCurrentEditor } from "@tiptap/react";
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import { useSubscribe } from "replicache-react";
import { z } from "zod";
import { getReplicache } from "../../app-replicache";
import { useReplicache } from "../../components/ReplicacheProvider";
import { getNote } from "../../model/Note";
import { CreateNoteButton } from "./components/CreateNoteButton";
import { NoteEditor } from "./components/NoteEditor";

export const loader = (args: LoaderFunctionArgs) => {
  return { user: args.context.user };
};

export const clientLoader = async (args: ClientLoaderFunctionArgs) => {
  const loaderData = await args.serverLoader<typeof loader>();
  const noteId = z.string().parse(args.params.noteId);
  const replicache = getReplicache(loaderData.user.id);
  const defaultNote = await replicache.query((tx) => getNote(tx, noteId));
  return { ...loaderData, noteId, defaultNote };
};

clientLoader.hydrate = true;

const EditorHeader = () => {
  const { editor } = useCurrentEditor();
  return (
    <header className="bg-gray-100 sticky top-0 z-10 p-6 flex justify-between items-center">
      <CreateNoteButton />

      <div className="-m-2 flex items-center gap-1">
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-4" />
        </button>
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-4" />
        </button>
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1Icon className="size-4" />
        </button>
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2Icon className="size-4" />
        </button>
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3Icon className="size-4" />
        </button>
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-4" />
        </button>
        <button
          type="button"
          className="p-2 bg-transparent transition-colors hover:bg-gray-200 rounded"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-4" />
        </button>
      </div>
      <div />
    </header>
  );
};

export default function NoteDetailRoute() {
  const { defaultNote, noteId } = useLoaderData<typeof clientLoader>();
  const replicache = useReplicache();
  const note = useSubscribe(replicache, (tx) => getNote(tx, noteId), {
    dependencies: [noteId],
    default: defaultNote,
  });

  return (
    <div className="grow flex flex-col gap-2 min-h-screen" key={note.id}>
      <NoteEditor
        slotBefore={
          <>
            <EditorHeader />
            <time className="text-center text-sm">
              {DateTime.fromISO(note.updatedAt).toLocaleString(
                DateTime.DATETIME_FULL,
              )}
            </time>
            <input
              type="text"
              defaultValue={note.title}
              className="focus:outline-none text-5xl font-extrabold mb-4 px-8"
              onChange={(e) =>
                replicache.mutate.updateNote({
                  id: noteId,
                  title: e.target.value,
                })
              }
            />
          </>
        }
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
