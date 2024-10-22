import { useNavigate } from "@remix-run/react";
import { TrashIcon } from "lucide-react";
import { useReplicache } from "../../../components/ReplicacheProvider";

export const DeleteNoteButton = () => {
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
