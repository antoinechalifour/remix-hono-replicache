import { StarterKit } from "@tiptap/starter-kit";
import { EditorProvider } from "@tiptap/react";
import { JSONContent } from "@tiptap/core/src/types";

const extensions = [StarterKit];

export const NoteEditor = ({
  content,
  onChange,
}: {
  content: JSONContent;
  onChange(content: JSONContent): void;
}) => {
  return (
    <EditorProvider
      onUpdate={(e) => onChange(e.editor.getJSON())}
      extensions={extensions}
      content={content}
      editorProps={{
        attributes: {
          class: "grow p-3 focus:outline-none",
        },
      }}
    ></EditorProvider>
  );
};
