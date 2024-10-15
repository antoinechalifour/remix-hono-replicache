import { JSONContent } from "@tiptap/core";
import { EditorProvider } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { ReactNode } from "react";

const extensions = [StarterKit];

export const NoteEditor = ({
  slotBefore,
  content,
  onChange,
}: {
  slotBefore: ReactNode;
  content: JSONContent;
  onChange(content: JSONContent): void;
}) => {
  return (
    <EditorProvider
      slotBefore={slotBefore}
      onUpdate={(e) => onChange(e.editor.getJSON())}
      extensions={extensions}
      content={content}
      editorProps={{
        attributes: {
          class: "grow max-w-none focus:outline-none prose prose-lg px-8 py-2",
        },
      }}
    ></EditorProvider>
  );
};
