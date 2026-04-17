import { AlignmentType, BorderStyle, Document as DocxDocument, HeadingLevel, Packer, PageBreak, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { Blueprint } from '../types';

interface MassViewExportPayload {
    blueprint: Blueprint;
    questionText?: string;
    answerRows?: string[][];
    includeQuestions: boolean;
    includeAnswers: boolean;
}

const getBaseFileName = (blueprint: Blueprint) =>
    `MassView_${blueprint.classLevel}_${blueprint.subject.replace(/\s+/g, '_')}_${(blueprint.setId || 'SetA').replace(/\s+/g, '_')}`;

const escapeXml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isSeparator = (line: string) => /^=+$/.test(line.trim());

const isLikelyHeader = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (isSeparator(trimmed)) return true;
    return (
        trimmed.startsWith('T') ||
        trimmed.startsWith('GI') ||
        trimmed.includes('சமக்ர சிக்ஷா கேரளம்') ||
        trimmed.includes('தொகுத்தறி மதிப்பீடு') ||
        trimmed.includes('Tamil Language Paper') ||
        trimmed.includes('தமிழ் முதல் தாள்') ||
        trimmed.includes('தமிழ் இரண்டாம் தாள்') ||
        trimmed.includes('நேரம்:') ||
        trimmed.includes('சிந்தனை நேரம்') ||
        trimmed.includes('குறிப்புகள்') ||
        trimmed.includes('Proforma for scoring key')
    );
};

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

const createQuestionParagraphs = (xml: XMLDocument) => {
    return Array.from(xml.querySelectorAll('questionDocument > line')).map((lineNode) => {
        const line = lineNode.textContent || '';
        const trimmed = line.trim();
        if (!trimmed) {
            return new Paragraph({ spacing: { after: 120 } });
        }
        if (isSeparator(trimmed)) {
            return new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, size: 18, color: '0F172A' })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 }
            });
        }
        const headerLike = isLikelyHeader(trimmed);
        return new Paragraph({
            children: [
                new TextRun({
                    text: line,
                    bold: headerLike,
                    color: headerLike ? '1D4ED8' : '1F2937',
                    size: headerLike ? 26 : 24,
                    font: /[அ-ஹ]/.test(line) ? 'TAU-Pallai' : 'Aptos'
                })
            ],
            alignment: headerLike ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { after: trimmed.includes('குறிப்புகள்') ? 120 : 90 }
        });
    });
};

const readRows = (nodes: Element[]) =>
    nodes.map(node => Array.from(node.querySelectorAll(':scope > cell')).map(cell => cell.textContent || ''));

const createAnswerHeaderParagraphs = (rows: string[][]) => {
    return rows.slice(0, 8).map((row, index) => {
        const text = row.filter(Boolean).join(index >= 5 && index <= 6 ? '    ' : ' ');
        return new Paragraph({
            alignment: index === 5 || index === 6 ? AlignmentType.LEFT : AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
                new TextRun({
                    text,
                    bold: index !== 7,
                    size: index === 7 ? 24 : 26,
                    color: index === 7 ? '9A3412' : '7C3AED',
                    font: /[அ-ஹ]/.test(text) ? 'TAU-Pallai' : 'Aptos'
                })
            ]
        });
    });
};

const createAnswerTable = (rows: string[][]) => {
    const headerRow = rows[8];
    const dataRows = rows.slice(9);

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: headerRow.map((cell, index) => new TableCell({
                    shading: { fill: 'DBEAFE', type: ShadingType.CLEAR },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: '111827' },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: '111827' },
                        left: { style: BorderStyle.SINGLE, size: 1, color: '111827' },
                        right: { style: BorderStyle.SINGLE, size: 1, color: '111827' }
                    },
                    width: { size: index === 2 ? 55 : 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: cell, bold: true, size: 22, font: /[அ-ஹ]/.test(cell) ? 'TAU-Pallai' : 'Aptos' })]
                        })
                    ]
                }))
            }),
            ...dataRows.map(row => new TableRow({
                children: row.map((cell, index) => new TableCell({
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: '111827' },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: '111827' },
                        left: { style: BorderStyle.SINGLE, size: 1, color: '111827' },
                        right: { style: BorderStyle.SINGLE, size: 1, color: '111827' }
                    },
                    width: { size: index === 2 ? 55 : 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: index === 2 ? AlignmentType.LEFT : AlignmentType.CENTER,
                            children: [new TextRun({ text: cell || ' ', size: 22, font: /[அ-ஹ]/.test(cell) ? 'TAU-Pallai' : 'Aptos' })]
                        })
                    ]
                }))
            }))
        ]
    });
};

export const exportMassViewDocx = async (payload: MassViewExportPayload) => {
    const xml = parseXml(buildMassViewXml(payload));
    const children: any[] = [];

    if (payload.includeQuestions && payload.questionText) {
        children.push(
            new Paragraph({
                text: 'Question Export',
                heading: HeadingLevel.HEADING_1,
                thematicBreak: true
            }),
            ...createQuestionParagraphs(xml)
        );
    }

    if (payload.includeAnswers && payload.answerRows?.length) {
        const answerRows = [
            ...readRows(Array.from(xml.querySelectorAll('answerDocument > header > row'))),
            ...readRows(Array.from(xml.querySelectorAll('answerDocument > body > row')))
        ];

        if (children.length > 0) {
            children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        children.push(
            new Paragraph({
                text: 'Answer Key Export',
                heading: HeadingLevel.HEADING_1,
                thematicBreak: true
            }),
            ...createAnswerHeaderParagraphs(answerRows),
            new Paragraph({ spacing: { after: 150 } }),
            createAnswerTable(answerRows)
        );
    }

    const doc = new DocxDocument({
        sections: [{ properties: {}, children }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${getBaseFileName(payload.blueprint)}.docx`);
};

export const exportMassViewIcml = async (payload: MassViewExportPayload) => {
    const xml = parseXml(buildMassViewXml(payload));
    const lines: string[] = [];

    if (payload.includeQuestions) {
        lines.push(...Array.from(xml.querySelectorAll('questionDocument > line')).map(node => node.textContent || ''));
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
