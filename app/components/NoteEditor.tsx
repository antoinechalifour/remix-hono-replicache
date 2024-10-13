import { StarterKit } from "@tiptap/starter-kit";
import { EditorProvider } from "@tiptap/react";

const extensions = [StarterKit];
const content = "<p>Hello World!</p>";

export const NoteEditor = () => {
  return (
    <EditorProvider
      onUpdate={(e) => console.log(e.editor.getJSON())}
      extensions={extensions}
      content={content}
      editorProps={{
        attributes: {
          class:
            "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
        },
      }}
    ></EditorProvider>
  );
};
