import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Image, Table as TableIcon, Plus, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';

const SimpleRichTextEditor = ({ value, onChange, placeholder, isAnswerTab = false }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, target: any }>({ x: 0, y: 0, visible: false, target: null });

    // Sync external value changes only when not focused to avoid cursor loss
    useEffect(() => {
        if (ref.current && document.activeElement !== ref.current) {
            const cleanHTML = DOMPurify.sanitize(value || '', {
                ADD_TAGS: ['table', 'tbody', 'tr', 'th', 'td', 'br', 'span', 'b', 'i', 'u', 'img', 'ul', 'ol', 'li', 'p'],
                ADD_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height', 'border', 'padding', 'margin'],
            });
            if (ref.current.innerHTML !== cleanHTML) {
                ref.current.innerHTML = cleanHTML;
            }
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleInput = () => {
        if (ref.current) {
            const rawHTML = ref.current.innerHTML;
            const cleanHTML = DOMPurify.sanitize(rawHTML, {
                ADD_TAGS: ['table', 'tbody', 'tr', 'th', 'td', 'br', 'span', 'b', 'i', 'u', 'img', 'ul', 'ol', 'li', 'p'],
                ADD_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height', 'border', 'padding', 'margin'],
            });
            onChange(cleanHTML);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (isAnswerTab) {
                // Insert a right-aligned score marker for answers
                document.execCommand('insertHTML', false, '&nbsp;<span style="float:right; font-weight:bold; margin-left: 20px;">( &nbsp;&nbsp; )</span>&nbsp;');
            } else {
                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
            }
            handleInput();
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const cell = target.closest('td, th');
        const table = target.closest('table');

        if (table) {
            e.preventDefault();
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                visible: true,
                target: { cell, table }
            });
        }
    };

    const exec = (cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        handleInput();
        ref.current?.focus();
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    const dataUrl = re.target?.result as string;
                    exec('insertImage', dataUrl);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleInsertTable = () => {
        const rows = prompt("Enter number of rows:", "3");
        const cols = prompt("Enter number of columns:", "2");
        if (rows && cols) {
            const r = parseInt(rows);
            const c = parseInt(cols);
            if (isNaN(r) || isNaN(c)) return;

            let tableHtml = '<table style="width:100%; border-collapse: collapse; border: 1px solid black; margin: 10px 0;">';
            for (let i = 0; i < r; i++) {
                tableHtml += '<tr>';
                for (let j = 0; j < c; j++) {
                    tableHtml += '<td style="border: 1px solid black; padding: 8px; min-width: 50px;">&nbsp;</td>';
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</table><p>&nbsp;</p>';
            exec('insertHTML', tableHtml);
        }
    };

    // Table Customization Logic
    const addRow = (above: boolean) => {
        const { cell } = contextMenu.target;
        if (!cell) return;
        const row = cell.parentElement;
        const newRow = row.cloneNode(true);
        // Clear content in new row cells
        //@ts-ignore
        Array.from(newRow.cells).forEach((c: any) => c.innerHTML = '&nbsp;');
        if (above) row.before(newRow);
        else row.after(newRow);
        handleInput();
    };

    const addCol = (after: boolean) => {
        const { cell, table } = contextMenu.target;
        if (!cell || !table) return;
        const index = cell.cellIndex;
        //@ts-ignore
        Array.from(table.rows).forEach((row: any) => {
            const newCell = row.insertCell(after ? index + 1 : index);
            newCell.innerHTML = '&nbsp;';
            newCell.style.border = '1px solid black';
            newCell.style.padding = '8px';
            newCell.style.minWidth = '50px';
        });
        handleInput();
    };

    const deleteTablePart = (type: 'row' | 'col' | 'table') => {
        const { cell, table } = contextMenu.target;
        if (!table) return;
        if (type === 'table') {
            table.remove();
        } else if (type === 'row' && cell) {
            cell.parentElement.remove();
        } else if (type === 'col' && cell) {
            const index = cell.cellIndex;
            //@ts-ignore
            Array.from(table.rows).forEach((row: any) => row.deleteCell(index));
        }
        handleInput();
    };

    return (
        <div className="border rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all relative">
            <div className="bg-gray-50 border-b p-1.5 flex flex-wrap gap-1 items-center">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Bold"><Bold size={14} /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Italic"><Italic size={14} /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Underline"><Underline size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Bullet List"><List size={14} /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Number List"><ListOrdered size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); handleImageUpload(); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Insert Image"><Image size={14} /></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); handleInsertTable(); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Insert Table"><TableIcon size={14} /></button>

                {isAnswerTab && (
                    <div className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">
                        Tab Key enabled for marks
                    </div>
                )}
            </div>
            <div
                ref={ref}
                contentEditable
                className="p-4 min-h-[150px] outline-none text-sm prose max-w-none editor-content tamil-font"
                onInput={handleInput}
                onBlur={handleInput}
                onKeyDown={handleKeyDown}
                onContextMenu={handleContextMenu}
                placeholder={placeholder}
            />

            {/* Table Context Menu */}
            {contextMenu.visible && (
                <div
                    className="fixed z-[100] bg-white border shadow-2xl rounded-lg py-2 w-52 overflow-hidden"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 mb-1">Table Controls</div>
                    <button onClick={() => { addRow(true); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"><Plus size={12} /> Add Row Above</button>
                    <button onClick={() => { addRow(false); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"><Plus size={12} /> Add Row Below</button>
                    <button onClick={() => { addCol(false); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"><Plus size={12} /> Add Column Left</button>
                    <button onClick={() => { addCol(true); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"><Plus size={12} /> Add Column Right</button>
                    <div className="border-t my-1"></div>
                    <button
                        onClick={() => {
                            const { cell } = contextMenu.target;
                            if (cell) {
                                const isHeader = cell.tagName === 'TH';
                                const row = cell.parentElement;
                                //@ts-ignore
                                Array.from(row.cells).forEach((c: any) => {
                                    const newTag = isHeader ? 'td' : 'th';
                                    const newCell = document.createElement(newTag);
                                    newCell.innerHTML = c.innerHTML;
                                    newCell.style.cssText = c.style.cssText;
                                    if (!isHeader) {
                                        newCell.style.fontWeight = 'bold';
                                        newCell.style.backgroundColor = '#f3f4f6';
                                    } else {
                                        newCell.style.fontWeight = 'normal';
                                        newCell.style.backgroundColor = 'transparent';
                                    }
                                    c.replaceWith(newCell);
                                });
                                handleInput();
                            }
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
                    >
                        <Bold size={12} /> Toggle Header Row
                    </button>
                    <button
                        onClick={() => {
                            const { cell } = contextMenu.target;
                            if (cell) {
                                cell.style.backgroundColor = cell.style.backgroundColor === 'yellow' ? 'transparent' : 'yellow';
                                handleInput();
                            }
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-yellow-50 flex items-center gap-2"
                    >
                        <div className="w-3 h-3 bg-yellow-400 border border-gray-300"></div> Highlight Cell (Yellow)
                    </button>
                    <div className="border-t my-1"></div>
                    <button onClick={() => { deleteTablePart('row'); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete Row</button>
                    <button onClick={() => { deleteTablePart('col'); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete Column</button>
                    <button onClick={() => { deleteTablePart('table'); setContextMenu(prev => ({ ...prev, visible: false })); }} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2 font-bold"><Trash2 size={12} /> Delete Entire Table</button>
                </div>
            )}
        </div>
    );
};

export default SimpleRichTextEditor;
