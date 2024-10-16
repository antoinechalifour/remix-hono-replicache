import { NavLink, useLoaderData } from "@remix-run/react";
import { DateTime } from "luxon";
import { useSubscribe } from "replicache-react";
import { useReplicache } from "../../components/ReplicacheProvider";
import { getNotes } from "../../model/Note";
import { clientLoader } from "../app/app.route";

export const NotesList = () => {
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
              <span>{note.previewContent}</span>
            </span>
          </NavLink>
        </li>
      ))}
    </ol>
  );
};
