import React, { useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { 
    Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, 
    AlignRight, AlignJustify, List, ListOrdered, Undo, Redo,
    Save, Type, ALargeSmall, FileText
} from 'lucide-react';

interface MiniWordProcessorProps {
    content: string;
    onChange: (content: string) => void;
    onSave?: () => void;
    onExport?: () => void;
}

// Custom Extension for Font Size
const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }) => {
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
            },
        };
    },
});

// Custom Extension for Tab and Shift+Tab behavior
const CustomShortcuts = Extension.create({
    name: 'customShortcuts',
    addKeyboardShortcuts() {
        return {
            'Tab': () => {
                return this.editor.commands.insertContent('\t');
            },
            'Shift-Tab': () => {
                // If in a list, let Tiptap handle standard outdent behavior
                if (this.editor.isActive('bulletList') || this.editor.isActive('orderedList')) {
                    return false; 
                }

                const { state } = this.editor;
                const { selection } = state;
                const { $from } = selection;
                
                // Get the range from cursor to the end of the current block (paragraph)
                const end = $from.end();
                const textAfter = state.doc.textBetween($from.pos, end);
                
                // Delete existing text after cursor and replace with a right-floated span
                return this.editor.chain()
                    .deleteRange({ from: $from.pos, to: end })
                    .insertContent(`<span style="float: right; display: inline-block; min-width: 10px;">${textAfter || '&nbsp;'}</span>`)
                    .focus($from.pos + 1) // Place cursor inside the new right-aligned area
                    .run();
            },
        };
    },
});

// Professional Exam Header Template with strict Table-based alignment
const EXAM_TEMPLATE = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; font-family: 'TAU-Paalai', serif;">
        <div style="border: 4px solid black; padding: 5px 12px; font-weight: bold; font-size: 20pt; background: #000; color: #fff;">A</div>
        <div style="text-align: center; flex: 1; padding: 0 20px;">
            <h1 style="font-size: 18pt; margin-bottom: 5px; font-weight: bold;">சமக்ர சிக்ஷா கேரளம்</h1>
            <h2 style="font-size: 14pt; margin-bottom: 5px; font-weight: bold;">முதல் பருவத் தொகுத்தறி மதிப்பீடு 2026-27</h2>
            <h2 style="font-size: 14pt; margin-bottom: 5px; font-weight: bold;">தமிழ் முதல் தாள்</h2>
            <h3 style="font-size: 12pt; margin-bottom: 0;">Tamil Language Paper I (AT)</h3>
        </div>
        <div style="border: 2px solid black; padding: 5px 10px; font-weight: bold; font-size: 14pt; border-radius: 4px; background: #000; color: #fff;">T1002</div>
    </div>
    
    <table style="width: 100%; border: none !important; border-collapse: collapse; margin-bottom: 10px; font-weight: bold; font-size: 11pt; font-family: 'TAU-Paalai', serif;">
        <tbody style="border: none !important;">
            <tr style="border: none !important;">
                <td style="text-align: left; padding: 2px 0; border: none !important; width: 50%;"><span style="border-bottom: 2px solid #2563eb; color: #2563eb;">நேரம்: 90 நிமிடம்</span></td>
                <td style="text-align: right; padding: 2px 0; border: none !important; width: 50%;">வகுப்பு: 10</td>
            </tr>
            <tr style="border: none !important;">
                <td style="text-align: left; padding: 2px 0; border: none !important;"><span style="border-bottom: 2px solid #2563eb; color: #2563eb;">சிந்தனை நேரம் : 15 நிமிடம்</span></td>
                <td style="text-align: right; padding: 2px 0; border: none !important;"><span style="border-bottom: 2px solid #2563eb; color: #2563eb;">மதிப்பெண்: 40</span></td>
            </tr>
        </tbody>
    </table>
    
    <hr style="border: none; border-top: 2px solid #475569; margin: 15px 0;" />

    <div style="margin-bottom: 25px; font-family: 'TAU-Paalai', serif;">
        <p style="color: #2563eb; font-weight: bold; text-decoration: underline; font-size: 12pt; margin-bottom: 8px;">குறிப்புகள்:</p>
        <ul style="margin-top: 5px; padding-left: 25px; list-style-type: none; line-height: 1.8;">
            <li>&#8270; முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.</li>
            <li>&#8270; வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.</li>
            <li>&#8270; வினாக்களை நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.</li>
            <li>&#8270; விடையளிக்கும்போது மதிப்பெண், நேரம் போன்றவற்றை கவனித்து செயல்படவும்.</li>
        </ul>
    </div>

    <hr style="border: none; border-top: 2px solid #475569; margin: 15px 0 30px 0;" />

    <div style="background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; margin-bottom: 25px; font-family: 'TAU-Paalai', serif;">
        <h3 style="font-size: 12pt; margin: 0;">
            <strong>I. 1 முதல் 4 வரையுள்ள அனைத்து வினாக்களுக்கும் சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக. (1 மதிப்பெண் வீதம்)</strong>
            <span style="float: right;">(4 x 1 = 4)</span>
        </h3>
    </div>

    <div style="margin-bottom: 25px; font-family: 'TAU-Paalai', serif; padding-left: 10px;">
        <p><strong>1. ஏதேனும் ஒன்றிற்கு விடையளிக்கவும்:</strong></p>
        <div style="margin-left: 30px; margin-top: 10px;">
            <p>அ) ................................................................</p>
            <p style="text-align: center; margin: 15px 0; font-weight: bold; color: #475569;">(அல்லது)</p>
            <p>ஆ) ................................................................</p>
        </div>
    </div>
`;

const MiniWordProcessor: React.FC<MiniWordProcessorProps> = ({ 
    content, 
    onChange, 
    onSave,
    onExport
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            FontFamily,
            Color,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            FontSize,
            CustomShortcuts,
        ],
        content: content || EXAM_TEMPLATE,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'ProseMirror exam-paper-editor focus:outline-none bg-white shadow-2xl my-10 mx-auto border border-gray-300',
                style: 'width: 210mm; min-height: 297mm; padding: 20mm; font-family: "TAU-Paalai", serif; font-size: 14pt; line-height: 1.6; color: #000; box-sizing: border-box; position: relative;',
            },
        },
    });

    useEffect(() => {
        if (editor && content && content !== editor.getHTML()) {
            if (Math.abs(editor.getHTML().length - content.length) > 50) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden font-sans">
            {/* Professional Toolbar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 p-2 flex flex-wrap items-center gap-2 shadow-sm px-8 no-print">
                <div className="flex items-center gap-1 border-r border-slate-100 pr-2">
                    <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"><Undo size={18} /></button>
                    <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"><Redo size={18} /></button>
                </div>

                <div className="flex items-center gap-2 border-r border-slate-100 pr-2">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 h-9">
                        <Type size={14} className="text-slate-400" />
                        <select 
                            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                            value={editor.getAttributes('textStyle').fontFamily || 'TAU-Paalai'}
                            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="TAU-Paalai">TAU-Paalai (Body)</option>
                            <option value="TAU-Urai">TAU-Urai (Heading)</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Arial">Arial</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 h-9">
                        <ALargeSmall size={14} className="text-slate-400" />
                        <select 
                            onChange={(e) => (editor.chain().focus() as any).setFontSize(e.target.value).run()}
                            value={editor.getAttributes('textStyle').fontSize || '14pt'}
                            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer w-[60px]"
                        >
                            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36].map(size => (
                                <option key={size} value={`${size}pt`}>{size}pt</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-1 border-r border-slate-100 pr-2">
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded transition-all ${editor.isActive('bold') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`} title="Bold"><Bold size={18} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded transition-all ${editor.isActive('italic') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`} title="Italic"><Italic size={18} /></button>
                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded transition-all ${editor.isActive('underline') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-600'}`} title="Underline"><UnderlineIcon size={18} /></button>
                </div>

                <div className="flex items-center gap-1 border-r border-slate-100 pr-2">
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}><AlignLeft size={18} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}><AlignCenter size={18} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}><AlignRight size={18} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-200 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}><AlignJustify size={18} /></button>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-slate-200 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}><List size={18} /></button>
                    <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-slate-200 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}><ListOrdered size={18} /></button>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    {onExport && (
                        <button onClick={onExport} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest border border-indigo-500">
                            <FileText size={16} /> Export to Word
                        </button>
                    )}
                    {onSave && (
                        <button onClick={onSave} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest border border-emerald-500">
                            <Save size={16} /> Save Document
                        </button>
                    )}
                </div>
            </div>

            {/* A4 Canvas Area */}
            <div className="flex-1 overflow-auto relative scrollbar-hide py-10">
                <div className="flex relative justify-center min-h-full">
                    <EditorContent editor={editor} className="tiptap-word-canvas select-text" />
                </div>
            </div>

            <style>{`
                /* Simulated A4 Page Breaks */
                .tiptap-word-canvas .ProseMirror {
                    outline: none !important;
                    background-image: 
                        linear-gradient(to bottom, transparent 296.6mm, #e2e8f0 296.6mm, #e2e8f0 297mm, transparent 297mm);
                    background-size: 100% 297mm;
                    white-space: pre-wrap !important;
                    tab-size: 8;
                }
                
                .tiptap-word-canvas .ProseMirror p {
                    margin-bottom: 0.3em;
                }

                .tiptap-word-canvas .ProseMirror h1 { font-size: 18pt; margin-bottom: 0.2em; font-family: 'TAU-Urai', serif; }
                .tiptap-word-canvas .ProseMirror h2 { font-size: 14pt; margin-bottom: 0.2em; font-family: 'TAU-Urai', serif; }
                .tiptap-word-canvas .ProseMirror h3 { font-size: 12pt; margin-bottom: 0.2em; font-family: 'Times New Roman', serif; }

                /* Tamil List & Indentation Fix */
                .tiptap-word-canvas .ProseMirror ul, 
                .tiptap-word-canvas .ProseMirror ol {
                    padding-left: 1.5rem;
                }

                /* Table Styling */
                .tiptap-word-canvas .ProseMirror table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 0;
                    overflow: hidden;
                }
                .tiptap-word-canvas .ProseMirror td,
                .tiptap-word-canvas .ProseMirror th {
                    min-width: 1em;
                    border: none;
                    padding: 3px 5px;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }

                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white !important; }
                    .tiptap-word-canvas .ProseMirror {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 20mm !important;
                        margin: 0 !important;
                        background-image: none !important;
                        width: 100% !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default MiniWordProcessor;
