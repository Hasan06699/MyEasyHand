'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Box, Tab, Tabs, TextField, Typography, Stack, IconButton, Divider } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconQuote,
  IconLink,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
} from '@tabler/icons-react';

type HtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  minHeight?: number;
};

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      title={title}
      color={active ? 'primary' : 'default'}
      sx={{ borderRadius: 1 }}
    >
      {children}
    </IconButton>
  );
}

export default function HtmlEditor({
  value,
  onChange,
  label = 'HTML Content',
  helperText = 'Full HTML page shown when the banner is opened',
  minHeight = 220,
}: HtmlEditorProps) {
  const [tab, setTab] = useState(0);
  const [codeValue, setCodeValue] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Write your HTML content here...' }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setCodeValue(html);
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      setCodeValue(value);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const applyCode = () => {
    if (!editor) return;
    editor.commands.setContent(codeValue || '', { emitUpdate: false });
    onChange(codeValue);
    setTab(0);
  };

  if (!editor) {
    return null;
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => {
            if (v === 0 && tab === 1) {
              applyCode();
            }
            setTab(v);
          }}
          sx={{ px: 1, borderBottom: 1, borderColor: 'divider', minHeight: 42 }}
        >
          <Tab label="Visual" sx={{ minHeight: 42 }} />
          <Tab label="HTML Code" sx={{ minHeight: 42 }} />
          <Tab label="Preview" sx={{ minHeight: 42 }} />
        </Tabs>

        {tab === 0 && (
          <>
            <Stack
              direction="row"
              spacing={0.25}
              sx={{ flexWrap: 'wrap', p: 0.75, borderBottom: 1, borderColor: 'divider' }}
            >
              <ToolbarButton
                title="Bold"
                active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <IconBold size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Italic"
                active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <IconItalic size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Underline"
                active={editor.isActive('underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <IconUnderline size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Strikethrough"
                active={editor.isActive('strike')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <IconStrikethrough size={18} />
              </ToolbarButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <ToolbarButton
                title="Heading 1"
                active={editor.isActive('heading', { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <IconH1 size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Heading 2"
                active={editor.isActive('heading', { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <IconH2 size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Heading 3"
                active={editor.isActive('heading', { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <IconH3 size={18} />
              </ToolbarButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <ToolbarButton
                title="Bullet list"
                active={editor.isActive('bulletList')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <IconList size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Numbered list"
                active={editor.isActive('orderedList')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <IconListNumbers size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Quote"
                active={editor.isActive('blockquote')}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <IconQuote size={18} />
              </ToolbarButton>
              <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
                <IconLink size={18} />
              </ToolbarButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <ToolbarButton
                title="Align left"
                active={editor.isActive({ textAlign: 'left' })}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
              >
                <IconAlignLeft size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Align center"
                active={editor.isActive({ textAlign: 'center' })}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
              >
                <IconAlignCenter size={18} />
              </ToolbarButton>
              <ToolbarButton
                title="Align right"
                active={editor.isActive({ textAlign: 'right' })}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
              >
                <IconAlignRight size={18} />
              </ToolbarButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
                <IconArrowBackUp size={18} />
              </ToolbarButton>
              <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
                <IconArrowForwardUp size={18} />
              </ToolbarButton>
            </Stack>

            <Box
              sx={{
                p: 2,
                minHeight,
                '& .tiptap': {
                  outline: 'none',
                  minHeight: minHeight - 32,
                  '& p': { my: 1 },
                  '& h1, & h2, & h3': { mt: 1.5, mb: 1 },
                  '& ul, & ol': { pl: 3 },
                  '& blockquote': {
                    borderLeft: '3px solid',
                    borderColor: 'divider',
                    pl: 2,
                    color: 'text.secondary',
                  },
                  '& a': { color: 'primary.main' },
                  '& p.is-editor-empty:first-of-type::before': {
                    color: 'text.disabled',
                    content: 'attr(data-placeholder)',
                    float: 'left',
                    height: 0,
                    pointerEvents: 'none',
                  },
                },
              }}
            >
              <EditorContent editor={editor} />
            </Box>
          </>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <TextField
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              onBlur={applyCode}
              fullWidth
              multiline
              minRows={10}
              placeholder="<div>Your HTML here</div>"
              InputProps={{
                sx: {
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 13,
                },
              }}
            />
          </Box>
        )}

        {tab === 2 && (
          <Box
            sx={{
              p: 2,
              minHeight,
              maxHeight: 360,
              overflow: 'auto',
              bgcolor: 'grey.50',
            }}
          >
            {codeValue ? (
              <Box dangerouslySetInnerHTML={{ __html: codeValue }} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nothing to preview yet
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
