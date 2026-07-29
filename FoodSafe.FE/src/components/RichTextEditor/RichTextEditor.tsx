import { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button, Tooltip } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  LinkOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { SafeHtmlContent } from "./SafeHtmlContent";
import "./RichTextEditor.css";

// ---- Toolbar helpers ------------------------------------------------

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  icon: ReactNode;
  title: string;
  disabled?: boolean;
}

function ToolbarBtn({
  onClick,
  active,
  icon,
  title,
  disabled,
}: ToolbarBtnProps) {
  return (
    <Tooltip title={title} mouseEnterDelay={0.8}>
      <Button
        size="small"
        type="text"
        icon={icon}
        disabled={disabled}
        onClick={onClick}
        className={active ? "rte-btn-active" : undefined}
      />
    </Tooltip>
  );
}

function ToolbarDivider() {
  return <span className="rte-toolbar-divider" />;
}

// ---- Main component -------------------------------------------------

export interface RichTextEditorProps {
  /** HTML string value — controlled by Ant Design Form.Item or parent state. */
  value?: string;
  /** Called with the updated HTML string whenever the user edits content. */
  onChange?: (html: string) => void;
  placeholder?: string;
  /**
   * When true, renders the HTML as a read-only div (no editor, no toolbar).
   * The HTML is sanitized before rendering.
   */
  readonly?: boolean;
  /** Forwarded from Ant Design Form.Item for label association. */
  id?: string;
}

/**
 * Reusable WYSIWYG rich-text editor based on TipTap v3.
 *
 * Designed to integrate seamlessly with Ant Design Form.Item:
 *   <Form.Item name="content">
 *     <RichTextEditor placeholder="..." />
 *   </Form.Item>
 *
 * Form.Item injects `value` and `onChange` automatically.
 *
 * In `readonly` mode the component renders sanitized HTML as a plain div,
 * suitable for detail drawers and preview panels.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  readonly,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Restrict headings to H2 and H3 — H1 is reserved for page title.
        heading: { levels: [2, 3] },
        // Configure the built-in Link extension (included in StarterKit v3).
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Nhập nội dung bài viết...",
      }),
    ],
    content: value ?? "",
    editable: !readonly,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
  });

  /**
   * Sync external value changes back into the editor — e.g., when
   * Ant Design Form calls setFieldsValue({ content: item.content })
   * after the modal opens for an existing item.
   *
   * Uses emitUpdate: false to avoid triggering onUpdate and causing
   * an infinite loop.
   */
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incoming = value ?? "";
    const current = editor.getHTML();
    if (incoming === current) return;
    // Treat "no value" and "empty editor" as equivalent — skip setContent.
    const editorIsEmpty = current === "<p></p>" || current === "";
    if (!incoming && editorIsEmpty) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, value]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập URL liên kết:", prev ?? "https://");
    if (url === null) return; // user cancelled
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }, [editor]);

  // ---- Readonly mode ----
  if (readonly) {
    return <SafeHtmlContent id={id} html={value ?? ""} />;
  }

  // ---- Edit mode ----
  return (
    <div id={id} className="rte-wrapper">
      {/* Toolbar */}
      <div
        className="rte-toolbar"
        role="toolbar"
        aria-label="Thanh công cụ soạn thảo"
      >
        {/* Inline marks */}
        <ToolbarBtn
          title="Đậm (Ctrl+B)"
          icon={<BoldOutlined />}
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor}
        />
        <ToolbarBtn
          title="Nghiêng (Ctrl+I)"
          icon={<ItalicOutlined />}
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor}
        />
        <ToolbarBtn
          title="Gạch chân (Ctrl+U)"
          icon={<UnderlineOutlined />}
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={!editor}
        />
        <ToolbarBtn
          title="Gạch ngang"
          icon={<StrikethroughOutlined />}
          active={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={!editor}
        />

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarBtn
          title="Tiêu đề 2"
          icon={<span className="rte-text-icon">H2</span>}
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={!editor}
        />
        <ToolbarBtn
          title="Tiêu đề 3"
          icon={<span className="rte-text-icon">H3</span>}
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={!editor}
        />

        <ToolbarDivider />

        {/* Lists & blockquote */}
        <ToolbarBtn
          title="Danh sách không thứ tự"
          icon={<UnorderedListOutlined />}
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor}
        />
        <ToolbarBtn
          title="Danh sách có thứ tự"
          icon={<OrderedListOutlined />}
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor}
        />
        <ToolbarBtn
          title="Trích dẫn"
          icon={<span className="rte-text-icon rte-blockquote-icon">❝</span>}
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={!editor}
        />

        <ToolbarDivider />

        {/* Link */}
        <ToolbarBtn
          title="Liên kết"
          icon={<LinkOutlined />}
          active={editor?.isActive("link")}
          onClick={handleSetLink}
          disabled={!editor}
        />

        <ToolbarDivider />

        {/* History */}
        <ToolbarBtn
          title="Hoàn tác (Ctrl+Z)"
          icon={<UndoOutlined />}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor}
        />
        <ToolbarBtn
          title="Làm lại (Ctrl+Y)"
          icon={<RedoOutlined />}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor}
        />
      </div>

      {/* Content area */}
      <div className="rte-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
