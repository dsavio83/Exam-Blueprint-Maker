import { AlignmentType, BorderStyle, Document as DocxDocument, HeadingLevel, Packer, PageBreak, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType, HeightRule, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import { Blueprint } from '../types';

interface MassViewExportPayload {
    blueprint: Blueprint;
    questionText?: string;
    answerRows?: string[][];
    includeQuestions: boolean;
    includeAnswers: boolean;
}

const TAMIL_FONT = 'TAU-Pallai';
const ENGLISH_FONT = 'Times New Roman';

const getBaseFileName = (blueprint: Blueprint) =>
    `MassView_${blueprint.classLevel}_${blueprint.subject.replace(/\s+/g, '_')}_${(blueprint.setId || 'SetA').replace(/\s+/g, '_')}`;

const isTamil = (text: string) => /[அ-ஹ]/.test(text);

const splitTextByLanguage = (text: string) => {
    const segments: Array<{ text: string, isTamil: boolean }> = [];
    let currentText = '';
    let currentIsTamil = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charIsTamil = isTamil(char);

        if (i === 0) {
            currentIsTamil = charIsTamil;
            currentText = char;
        } else if (charIsTamil === currentIsTamil) {
            currentText += char;
        } else {
            segments.push({ text: currentText, isTamil: currentIsTamil });
            currentIsTamil = charIsTamil;
            currentText = char;
        }
    }
    if (currentText) {
        segments.push({ text: currentText, isTamil: currentIsTamil });
    }
    return segments;
};

const createLanguageRuns = (text: string, options: any = {}) => {
    const segments = splitTextByLanguage(text);
    return segments.map(seg => new TextRun({
        ...options,
        text: seg.text,
        font: seg.isTamil ? TAMIL_FONT : ENGLISH_FONT,
        size: seg.isTamil ? (options.sizeTamil || options.size || 24) : (options.size || 24)
    }));
};

const createHorizontalLine = () => {
    return new Paragraph({
        border: {
            bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
        spacing: { before: 100, after: 100 }
    });
};

const escapeXml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildMassViewXml = (payload: MassViewExportPayload) => {
    const questionNodes = payload.includeQuestions && payload.questionText
        ? payload.questionText.split('\n').map(line => `<line>${escapeXml(line)}</line>`).join('')
        : '';

    const answerHeaderRows = payload.includeAnswers && payload.answerRows?.length
        ? payload.answerRows.slice(0, 9).map(row =>
            `<row>${row.map(cell => `<cell>${escapeXml(cell)}</cell>`).join('')}</row>`
        ).join('')
        : '';

    const answerDataRows = payload.includeAnswers && payload.answerRows?.length
        ? payload.answerRows.slice(9).map(row =>
            `<row>${row.map(cell => `<cell>${escapeXml(cell)}</cell>`).join('')}</row>`
        ).join('')
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<massViewExport>
    <meta>
        <classLevel>${escapeXml(String(payload.blueprint.classLevel))}</classLevel>
        <subject>${escapeXml(payload.blueprint.subject)}</subject>
        <setId>${escapeXml(payload.blueprint.setId || 'Set A')}</setId>
        <includeQuestions>${payload.includeQuestions}</includeQuestions>
        <includeAnswers>${payload.includeAnswers}</includeAnswers>
    </meta>
    <questionDocument>${questionNodes}</questionDocument>
    <answerDocument>
        <header>${answerHeaderRows}</header>
        <body>${answerDataRows}</body>
    </answerDocument>
</massViewExport>`;
};

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

const readRows = (nodes: Element[]) =>
    nodes.map(node => Array.from(node.querySelectorAll(':scope > cell')).map(cell => cell.textContent || ''));

const createHeader = (bp: Blueprint) => {
    const setLabel = bp.setId || 'SET A';
    const code = bp.subject.includes('BT') ? 'T1012' : 'T1002';

    const line1 = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({
                            children: [
                                new TextRun({
                                    text: setLabel,
                                    bold: true,
                                    size: 24,
                                    font: ENGLISH_FONT,
                                    border: { style: BorderStyle.SINGLE, size: 1, space: 1, color: "000000" }
                                })
                            ]
                        })]
                    }),
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: createLanguageRuns("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 28, sizeTamil: 28 })
                        })]
                    }),
                    new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    text: code,
                                    bold: true,
                                    size: 24,
                                    font: ENGLISH_FONT,
                                    color: "FFFFFF",
                                    shading: { fill: "000000", type: ShadingType.CLEAR }
                                })
                            ]
                        })]
                    })
                ]
            })
        ]
    });

    const term = bp.examTerm === 'First Term Summative' ? 'முதல் பருவத் தொகுத்தறி மதிப்பீடு 2026-27' : 'தொகுத்தறி மதிப்பீடு 2026-27';
    const subTamil = bp.subject.includes('BT') ? 'தமிழ் இரண்டாம் தாள்' : 'தமிழ் முதல் தாள்';
    const subEng = bp.subject.includes('BT') ? 'Tamil Language Paper II (BT)' : 'Tamil Language Paper I (AT)';

    return [
        line1,
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: createLanguageRuns(term, { bold: true, size: 26 })
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: createLanguageRuns(subTamil, { bold: true, size: 26 })
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: createLanguageRuns(subEng, { bold: true, size: 24 })
        }),
        new Paragraph({
            spacing: { before: 100 },
            children: [
                ...createLanguageRuns(`நேரம்: 90 நிமிடம்`, { size: 22 }),
                new TextRun({ text: "\t\t\t\t\t\t\t\t", font: ENGLISH_FONT }),
                ...createLanguageRuns(`வகுப்பு ${bp.classLevel}`, { size: 22 })
            ]
        }),
        new Paragraph({
            children: [
                ...createLanguageRuns(`சிந்தனை நேரம் : 15 நிமிடம்`, { size: 22 }),
                new TextRun({ text: "\t\t\t\t\t\t\t", font: ENGLISH_FONT }),
                ...createLanguageRuns(`மதிப்பெண் : 40`, { size: 22 })
            ]
        }),
        createHorizontalLine()
    ];
};

const createNotes = () => {
    return [
        new Paragraph({
            children: createLanguageRuns("குறிப்புகள்:", { bold: true, size: 22 })
        }),
        new Paragraph({
            indent: { left: 360 },
            children: createLanguageRuns("- முதல் 15 நிமிடம் சிந்தனை நேரமாகும்.", { size: 20 })
        }),
        new Paragraph({
            indent: { left: 360 },
            children: createLanguageRuns("- வினாக்களை வாசித்து விடைகளை வரிசைப்படுத்த இந்த நேரத்தைப் பயன்படுத்தலாம்.", { size: 20 })
        }),
        new Paragraph({
            indent: { left: 360 },
            children: createLanguageRuns("- வினாக்களையும் குறிப்புகளையும் நன்கு வாசித்துப் புரிந்து விடையளிக்கவும்.", { size: 20 })
        }),
        new Paragraph({
            indent: { left: 360 },
            children: createLanguageRuns("- விடையளிக்கும்போது மதிப்பெண், நேரம் போன்றவற்றை கவனித்து செயல்படவும்.", { size: 20 })
        }),
        new Paragraph({ spacing: { after: 200 } })
    ];
};

export const exportMassViewDocx = async (payload: MassViewExportPayload) => {
    const children: any[] = [];
    const bp = payload.blueprint;

    if (payload.includeQuestions && payload.questionText) {
        children.push(...createHeader(bp));
        children.push(...createNotes());

        const lines = payload.questionText.split('\n');
        let startIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('---') || lines[i].includes('===')) {
                startIndex = i + 1;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].includes('===')) {
                        startIndex = j + 1;
                        break;
                    }
                }
                break;
            }
        }

        lines.slice(startIndex).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                children.push(new Paragraph({ spacing: { after: 120 } }));
                return;
            }

            const isQuestion = /^\d+\./.test(trimmed);
            const isOption = /^\s*\(.\)/.test(line);

            children.push(new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: isQuestion ? { left: 0, hanging: 0 } : (isOption ? { left: 720 } : { left: 360 }),
                spacing: { after: 80 },
                children: createLanguageRuns(line, { size: 24, sizeTamil: 24 })
            }));
        });
    }

    if (payload.includeAnswers && payload.answerRows?.length) {
        if (children.length > 0) children.push(new Paragraph({ children: [new PageBreak()] }));

        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: createLanguageRuns("விடைக்குறிப்பு / ANSWER KEY", { bold: true, size: 28 })
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: createLanguageRuns(`${bp.academicYear} | Grade ${bp.classLevel} | ${bp.subject}`, { size: 22 })
            }),
            createHorizontalLine()
        );

        const headerRow = payload.answerRows[8] || [];
        const dataRows = payload.answerRows.slice(9);

        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: headerRow.map(cell => new TableCell({
                        shading: { fill: "F3F4F6" },
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: createLanguageRuns(cell, { bold: true, size: 20 })
                        })]
                    }))
                }),
                ...dataRows.map(row => new TableRow({
                    children: row.map((cell, idx) => new TableCell({
                        children: [new Paragraph({
                            alignment: idx === 2 ? AlignmentType.LEFT : AlignmentType.CENTER,
                            children: createLanguageRuns(cell, { size: 20 })
                        })]
                    }))
                }))
            ]
        }));
    }

    const doc = new DocxDocument({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, right: 720, bottom: 720, left: 720 }
                }
            },
            children
        }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${getBaseFileName(bp)}.docx`);
};

export const exportMassViewIcml = async (payload: MassViewExportPayload) => {
    const xml = parseXml(buildMassViewXml(payload));
    const lines: string[] = [];

    if (payload.includeQuestions && payload.questionText) {
        lines.push(...payload.questionText.split('\n'));
    }

    if (payload.includeAnswers) {
        if (lines.length > 0) lines.push('', 'ANSWER KEY', '');
        const header = readRows(Array.from(xml.querySelectorAll('answerDocument > header > row')));
        const body = readRows(Array.from(xml.querySelectorAll('answerDocument > body > row')));
        lines.push(...header.map(row => row.filter(Boolean).join('\t')));
        lines.push(...body.map(row => row.join('\t')));
    }

    const paragraphs = lines.map(line => `
    <ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/$ID/NormalParagraphStyle">
        <CharacterStyleRange AppliedCharacterStyle="CharacterStyle/$ID/[No character style]">
            <Content>${escapeXml(line || ' ')}</Content>
        </CharacterStyleRange>
    </ParagraphStyleRange>`).join('');

    const icml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?aid style="50" type="document" readerVersion="6.0" featureSet="257" product="20.0(0)"?>
<Story Self="story_u1" AppliedTOCStyle="n" TrackChanges="false" StoryTitle="${escapeXml(getBaseFileName(payload.blueprint))}">
    <StoryPreference OpticalMarginAlignment="false" OpticalMarginSize="12" FrameType="TextFrameType"/>
    <InCopyExportOption IncludeGraphicProxies="true" IncludeAllResources="false"/>
    ${paragraphs}
</Story>`;

    const blob = new Blob([icml], { type: 'application/xml;charset=utf-8' });
    saveAs(blob, `${getBaseFileName(payload.blueprint)}.icml`);
};
