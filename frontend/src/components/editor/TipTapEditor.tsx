import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { MediaLibraryModal } from '../media/MediaLibraryModal';
import { MediaAsset } from '../../types';
import { useToast } from '../ui/Toast';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  Undo,
  Redo,
  Unlink,
  Plus,
  Trash2
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing your article...',
  minHeight = '360px'
}) => {
  const { showToast } = useToast();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(content || '');

  // Track the last HTML emitted from the editor or source textarea
  // to prevent unnecessary re-render setContent cycles that reset cursor
  const lastEmittedHtmlRef = useRef<string>(content || '');

  // Track selection before opening media modal to insert image at exact cursor
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-editorial-red underline font-medium hover:opacity-80',
          rel: 'noopener noreferrer'
        }
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'rounded-md my-4 max-w-full h-auto mx-auto shadow-sm block'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-slate-300 dark:border-navy-700'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 p-2 font-bold text-left'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 dark:border-navy-700 p-2'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty'
      })
    ],
    content: content || '',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtmlRef.current = html;
      setRawHtml(html);
      onChange(html);
    }
  });

  // Synchronize external content changes (e.g. initial fetch in AdminEditPostPage)
  useEffect(() => {
    if (!editor) return;

    // If the content change originated from this editor, do not re-set content
    if (content === lastEmittedHtmlRef.current) {
      return;
    }

    lastEmittedHtmlRef.current = content || '';
    setRawHtml(content || '');

    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  // Handle direct HTML changes in Source Mode
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    lastEmittedHtmlRef.current = val;
    setRawHtml(val);
    onChange(val);
  };

  // Toggle between WYSIWYG and HTML source modes
  const handleToggleSource = () => {
    if (isSourceMode) {
      // Switching from HTML source to WYSIWYG
      editor?.commands.setContent(rawHtml, { emitUpdate: false });
      lastEmittedHtmlRef.current = rawHtml;
      onChange(rawHtml);
      setIsSourceMode(false);
    } else {
      // Switching from WYSIWYG to HTML source
      const currentHtml = editor?.getHTML() || '';
      lastEmittedHtmlRef.current = currentHtml;
      setRawHtml(currentHtml);
      setIsSourceMode(true);
    }
  };

  // Safe Link insertion and editing
  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL (e.g., https://example.com):', previousUrl);

    if (url === null) return;

    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    if (trimmed.toLowerCase().startsWith('javascript:')) {
      showToast('Javascript links are not permitted for security reasons.', 'error');
      return;
    }

    let formattedUrl = trimmed;
    if (
      !/^https?:\/\//i.test(formattedUrl) &&
      !formattedUrl.startsWith('/') &&
      !formattedUrl.startsWith('#') &&
      !formattedUrl.startsWith('mailto:')
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().focus().insertContent(`<a href="${formattedUrl}">${formattedUrl}</a>`).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    }
  };

  // Open Media Library Modal preserving exact cursor position
  const handleOpenMediaModal = () => {
    if (editor) {
      savedSelectionRef.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to
      };
    }
    setIsMediaModalOpen(true);
  };

  // Insert image at the preserved cursor position
  const handleMediaSelect = (asset: MediaAsset) => {
    try {
      if (!editor) return;
      const imageUrl = asset.secureUrl || asset.url;
      if (!imageUrl) {
        showToast('Unable to insert the image. Please try again.', 'error');
        return;
      }

      // Restore saved cursor position if available
      if (savedSelectionRef.current) {
        editor.commands.setTextSelection(savedSelectionRef.current);
      }

      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl,
          alt: asset.alt || asset.originalFilename || 'Article Image',
          title: asset.caption || ''
        })
        .run();

      setIsMediaModalOpen(false);
      savedSelectionRef.current = null;
    } catch {
      showToast('Unable to insert the image. Please try again.', 'error');
    }
  };

  if (!editor) {
    return (
      <div
        className="flex items-center justify-center border border-slate-200 dark:border-navy-700 rounded-lg bg-slate-50 dark:bg-navy-900 text-xs text-slate-400"
        style={{ minHeight }}
      >
        Loading article editor...
      </div>
    );
  }

  const isInsideTable = editor.isActive('table');

  return (
    <div className="border border-slate-200 dark:border-navy-700 rounded-lg overflow-hidden bg-white dark:bg-navy-850 shadow-sm focus-within:border-editorial-red dark:focus-within:border-editorial-red transition-colors">
      {/* Editorial Toolbar */}
      <div
        role="toolbar"
        aria-label="Article formatting toolbar"
        className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-300"
      >
        {/* History: Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 disabled:opacity-30 transition-colors"
            title="Undo"
            aria-label="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 disabled:opacity-30 transition-colors"
            title="Redo"
            aria-label="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings & Paragraph */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 rounded text-xs transition-colors ${
              editor.isActive('paragraph') && !editor.isActive('heading')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Paragraph"
            aria-label="Paragraph"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded text-xs transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Heading 1"
            aria-label="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded text-xs transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Heading 2"
            aria-label="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded text-xs transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Heading 3"
            aria-label="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Styling: Bold, Italic, Underline, Strike */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Bold"
            aria-label="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Italic"
            aria-label="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('underline')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Underline"
            aria-label="Underline"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('strike')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Strikethrough"
            aria-label="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Align Left"
            aria-label="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Align Center"
            aria-label="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Align Right"
            aria-label="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Justify"
            aria-label="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Quotes & Dividers */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Quote"
            aria-label="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 transition-colors"
            title="Horizontal Rule"
            aria-label="Horizontal Rule"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insert Elements: Link, Media Library Image, Table */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={handleSetLink}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('link')
                ? 'bg-editorial-red text-white'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title={editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
            aria-label="Insert or edit link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 text-rose-500 transition-colors"
              title="Remove Link"
              aria-label="Remove link"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenMediaModal}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 text-editorial-red font-semibold flex items-center gap-1 transition-colors"
            title="Insert Image from Media Library"
            aria-label="Insert Image from Media Library"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline font-bold">Media</span>
          </button>

          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className={`p-1.5 rounded transition-colors ${
              isInsideTable
                ? 'bg-editorial-red/10 text-editorial-red font-bold'
                : 'hover:bg-slate-200 dark:hover:bg-navy-800'
            }`}
            title="Insert Table (3x3)"
            aria-label="Insert Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {/* Contextual Table Controls when inside table */}
          {isInsideTable && (
            <div className="flex items-center gap-0.5 pl-1 bg-slate-100 dark:bg-navy-800 rounded px-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-navy-700 flex items-center gap-0.5"
                title="Add Row"
                aria-label="Add Row"
              >
                <Plus className="w-2.5 h-2.5" /> Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-rose-500 hover:bg-slate-200 dark:hover:bg-navy-700"
                title="Delete Row"
                aria-label="Delete Row"
              >
                - Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-navy-700 flex items-center gap-0.5"
                title="Add Column"
                aria-label="Add Column"
              >
                <Plus className="w-2.5 h-2.5" /> Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-rose-500 hover:bg-slate-200 dark:hover:bg-navy-700"
                title="Delete Column"
                aria-label="Delete Column"
              >
                - Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-1 rounded text-rose-500 hover:bg-slate-200 dark:hover:bg-navy-700"
                title="Delete Table"
                aria-label="Delete Table"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Source Mode Toggle (HTML / WYSIWYG) */}
        <button
          type="button"
          onClick={handleToggleSource}
          className={`p-1.5 rounded text-xs flex items-center gap-1 font-mono transition-colors ${
            isSourceMode
              ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900 shadow-sm'
              : 'hover:bg-slate-200 dark:hover:bg-navy-800'
          }`}
          title={isSourceMode ? 'Switch to Visual Editor' : 'Switch to HTML Source'}
          aria-label={isSourceMode ? 'Switch to Visual Editor' : 'Switch to HTML Source'}
        >
          <Code className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase font-bold">{isSourceMode ? 'WYSIWYG' : 'HTML'}</span>
        </button>
      </div>

      {/* Editor Content Area */}
      {isSourceMode ? (
        <textarea
          value={rawHtml}
          onChange={handleSourceChange}
          className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 focus:outline-none resize-y"
          style={{ minHeight }}
          spellCheck={false}
          aria-label="HTML source editor"
        />
      ) : (
        <div
          className="p-4 sm:p-6 cursor-text overflow-x-auto"
          style={{ minHeight }}
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus();
            }
          }}
        >
          <EditorContent
            editor={editor}
            className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed"
          />
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          savedSelectionRef.current = null;
        }}
        onSelect={handleMediaSelect}
        allowedTypes={['image']}
        title="Insert Image into Article Content"
      />
    </div>
  );
};
