import { JSONContent } from "@tiptap/core/src/types";
import { EditorProvider } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";

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
          class: "grow focus:outline-none prose prose-lg",
        },
      }}
    ></EditorProvider>
  );
};
