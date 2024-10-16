import { useNavigate } from "@remix-run/react";
import { PenSquareIcon } from "lucide-react";
import { useReplicache } from "../../../../components/ReplicacheProvider";

export const CreateNoteButton = () => {
  const replicache = useReplicache();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="-m-2 p-2 bg-transparent transition-colors rounded hover:bg-gray-200"
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
