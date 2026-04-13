import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, VerticalAlign, ShadingType } from "docx";
import { saveAs } from "file-saver";
import { Blueprint, Curriculum, KnowledgeLevel, CognitiveProcess, ItemFormat, Unit } from "../types";

// Helper constants for styling
const BLACK = "000000";
const GREEN_HEADER = "E2EFDA";
const ORANGE_HEADER = "FCE4D6";
const ORANGE_SUBHEADER = "FFF2CC";
const PURPLE_SOFT = "F5E6FF";

/**
 * Service to export blueprint reports and answer key to Word document
 */
export class DocExportService {

    private static createTableCell(text: string, options: { 
        bold?: boolean, 
        size?: number, 
        align?: any, 
        rowSpan?: number, 
        colSpan?: number, 
        shading?: string,
        italic?: boolean,
        font?: string
    } = {}) {
        return new TableCell({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text,
                            bold: options.bold,
                            size: options.size || (/[அ-ஹ]/.test(text) ? 28 : 22), // 14pt for Tamil, 11pt for English
                            italics: options.italic,
                            font: options.font || (/[அ-ஹ]/.test(text) ? "TAU-Pallai" : "Inter")
                        }),
                    ],
                    alignment: options.align || AlignmentType.CENTER,
                    spacing: { before: 120, after: 120 }
                }),
            ],
            rowSpan: options.rowSpan,
            columnSpan: options.colSpan,
            shading: options.shading ? { fill: options.shading, type: ShadingType.CLEAR } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                left: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                right: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
            }
        });
    }

    private static createRichParagraph(text: string, options: { 
        bold?: boolean, 
        size?: number, 
        align?: any,
        color?: string,
        italic?: boolean
    } = {}) {
        return new Paragraph({
            children: [
                new TextRun({
                    text,
                    bold: options.bold,
                    italics: options.italic,
                    size: options.size || (/[அ-ஹ]/.test(text) ? 28 : 22),
                    color: options.color,
                    font: /[அ-ஹ]/.test(text) ? "TAU-Pallai" : "Inter"
                }),
            ],
            alignment: options.align || AlignmentType.LEFT,
            spacing: { before: 100, after: 100 }
        });
    }

    private static getAcademicYear(blueprint: Blueprint) {
        if (blueprint.academicYear) return blueprint.academicYear;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        if (month <= 4) return `${year - 1}-${year}`;
        return `${year}-${year + 1}`;
    }

    private static getTermTamil(term: string) {
        switch (term) {
            case 'First Term Exam': return 'முதல்';
            case 'Second Term Exam': return 'இரண்டாம்';
            case 'Third Term Exam': return 'மூன்றாம்';
            default: return 'முதல்';
        }
    }

    private static getSubjectInfo(subject: string) {
        if (subject.includes('AT')) {
            return { tamil: 'தமிழ் முதல் தாள் (AT)', eng: 'First Language - Tamil Paper I', code: '02' };
        }
        return { tamil: 'தமிழ் இரண்டாம் தாள் (BT)', eng: 'First Language - Tamil Paper II', code: '12' };
    }

    private static createOfficialHeaderRows(blueprint: Blueprint, totalCols: number = 2) {
        const subInfo = this.getSubjectInfo(blueprint.subject);
        const academicYear = this.getAcademicYear(blueprint);
        const termTamil = this.getTermTamil(blueprint.examTerm);
        const qpCode = `T${blueprint.classLevel}${subInfo.code}`;

        const col1Span = Math.ceil(totalCols * 0.6);
        const col2Span = totalCols - col1Span;

        return [
            new TableRow({
                children: [
                    this.createTableCell(`${termTamil} பருவ தொகுத்தறி மதிப்பீடு ${academicYear}`, { bold: true, size: 24, colSpan: totalCols > 2 ? col1Span : undefined }),
                    this.createTableCell(`GI ${qpCode}`, { bold: true, size: 24, colSpan: totalCols > 2 ? col2Span : undefined }),
                ]
            }),
            new TableRow({
                children: [
                    this.createTableCell(subInfo.tamil, { bold: true, size: 24, colSpan: totalCols > 2 ? col1Span : undefined }),
                    this.createTableCell(subInfo.eng, { bold: true, size: 20, colSpan: totalCols > 2 ? col2Span : undefined }),
                ]
            })
        ];
    }

    /**
     * Export Report 1: Weightage Analysis
     */
    static async exportReport1(blueprint: Blueprint, curriculum: Curriculum) {
        const academicYear = this.getAcademicYear(blueprint);
        const subInfo = this.getSubjectInfo(blueprint.subject);
        const termTamil = this.getTermTamil(blueprint.examTerm);
        const qpCode = `T${blueprint.classLevel}${subInfo.code}`;
        const setId = (blueprint.setId || 'Set A').replace('Set ', '');
        const termEnglish = blueprint.examTerm.split(' ')[0];

        // Stats calculation
        const stats = {
            kv: {} as Record<string, number>,
            cp: {} as Record<string, number>,
            kl: {} as Record<string, number>,
            content: {} as Record<string, number>
        };
        blueprint.items.forEach(item => {
            stats.content[item.unitId] = (stats.content[item.unitId] || 0) + item.totalMarks;
            stats.kl[item.knowledgeLevel] = (stats.kl[item.knowledgeLevel] || 0) + item.totalMarks;
            stats.cp[item.cognitiveProcess] = (stats.cp[item.cognitiveProcess] || 0) + item.totalMarks;
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    this.createRichParagraph(setId, { bold: true, size: 28 }),
                    this.createRichParagraph("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 36, align: AlignmentType.CENTER }),
                    this.createRichParagraph("Weightage Analysis / Table of Specifications", { bold: true, italic: true, size: 28, color: "FF0080", align: AlignmentType.CENTER }),
                    
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            ...this.createOfficialHeaderRows(blueprint, 2),
                            new TableRow({
                                children: [
                                    this.createTableCell(`Std. : ${blueprint.classLevel}`, { bold: true, align: AlignmentType.LEFT }),
                                    this.createTableCell(`Score : ${blueprint.totalMarks}`, { bold: true, align: AlignmentType.RIGHT }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Paragraph({ text: "I. Weightage to Content Area", heading: HeadingLevel.HEADING_3 }),
                    
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Sl. No.", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Learning Outcomes (LOs)", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Unit / Topic", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Sub-unit", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Percentage", { bold: true, shading: GREEN_HEADER }),
                                ]
                            }),
                            ...curriculum.units.filter(u => (stats.content[u.id] || 0) > 0).map((u, idx) => {
                                const score = stats.content[u.id] || 0;
                                return new TableRow({
                                    children: [
                                        this.createTableCell((idx + 1).toString()),
                                        this.createTableCell(u.learningOutcomes || "-", { align: AlignmentType.LEFT, size: 18 }),
                                        this.createTableCell(u.name),
                                        this.createTableCell(u.subUnits.map(s => s.name).join(", "), { size: 18 }),
                                        this.createTableCell(score.toString(), { bold: true }),
                                        this.createTableCell(`${((score / blueprint.totalMarks) * 100).toFixed(1)}%`),
                                    ]
                                });
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Paragraph({ text: "II. Weightage to Cognitive Process", heading: HeadingLevel.HEADING_3 }),
                    new Table({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Sl. No.", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Cognitive Process", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Percentage", { bold: true, shading: GREEN_HEADER }),
                                ]
                            }),
                            ...Object.entries(CognitiveProcess).map(([key, value], idx) => {
                                const score = stats.cp[value] || 0;
                                return new TableRow({
                                    children: [
                                        this.createTableCell(`CP${idx + 1}`),
                                        this.createTableCell(value, { align: AlignmentType.LEFT }),
                                        this.createTableCell(score > 0 ? score.toString() : "-"),
                                        this.createTableCell(score > 0 ? `${((score / blueprint.totalMarks) * 100).toFixed(1)}%` : "-"),
                                    ]
                                });
                            })
                        ]
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Report1_${blueprint.id}.docx`);
    }

    /**
     * Export Report 2: Item-wise Analysis
     */
    static async exportReport2(blueprint: Blueprint, curriculum: Curriculum) {
        const groupedItemsMap = blueprint.items.reduce((acc, item) => {
            const key = `${item.unitId}-${item.subUnitId}-${item.marksPerQuestion}-${item.knowledgeLevel}-${item.knowledgeLevelB || ''}-${item.cognitiveProcess}-${item.cognitiveProcessB || ''}-${item.itemFormat}-${item.itemFormatB || ''}-${item.hasInternalChoice ? 'yes' : 'no'}`;
            if (!acc[key]) {
                acc[key] = { ...item, questionCount: 1, totalMarks: item.marksPerQuestion };
            } else {
                acc[key].questionCount += 1;
                acc[key].totalMarks += item.marksPerQuestion;
            }
            return acc;
        }, {} as Record<string, any>);

        const sortedGroups = Object.values(groupedItemsMap).sort((a, b) => a.marksPerQuestion - b.marksPerQuestion);
        
        const rows = [
            ...this.createOfficialHeaderRows(blueprint, 17),
            new TableRow({
                children: [this.createTableCell(" ", { size: 1, colSpan: 17 })] // Spacer row
            }),
            // Header Row 1
            new TableRow({
                children: [
                    this.createTableCell("Item/ Qn. No.", { rowSpan: 2, shading: ORANGE_HEADER, size: 18 }),
                    this.createTableCell("Content Area", { colSpan: 3, shading: ORANGE_HEADER, size: 18 }),
                    this.createTableCell("Knowledge level", { colSpan: 3, shading: ORANGE_HEADER, size: 18 }),
                    this.createTableCell("Cognitive Process", { colSpan: 7, shading: ORANGE_HEADER, size: 18 }),
                    this.createTableCell("Item Format", { colSpan: 6, shading: ORANGE_HEADER, size: 18 }),
                    this.createTableCell("Score", { rowSpan: 2, shading: ORANGE_HEADER, size: 18 }),
                    this.createTableCell("Time", { rowSpan: 2, shading: ORANGE_HEADER, size: 18 }),
                ]
            }),
            // Header Row 2
            new TableRow({
                children: [
                    this.createTableCell("LO", { shading: ORANGE_SUBHEADER, size: 16 }),
                    this.createTableCell("Unit", { shading: ORANGE_SUBHEADER, size: 16 }),
                    this.createTableCell("Sub-Unit", { shading: ORANGE_SUBHEADER, size: 16 }),
                    this.createTableCell("B", { shading: ORANGE_SUBHEADER, size: 16 }),
                    this.createTableCell("A", { shading: ORANGE_SUBHEADER, size: 16 }),
                    this.createTableCell("P", { shading: ORANGE_SUBHEADER, size: 16 }),
                    ...[1, 2, 3, 4, 5, 6, 7].map(n => this.createTableCell(`CP${n}`, { shading: ORANGE_SUBHEADER, size: 14 })),
                    ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(f, { shading: ORANGE_SUBHEADER, size: 14 })),
                ]
            })
        ];

        sortedGroups.forEach((item, idx) => {
            const unit = curriculum.units.find(u => u.id === item.unitId);
            const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);
            
            const createDataRow = (suffix: string = "") => {
                return new TableRow({
                    children: [
                        this.createTableCell(`${idx + 1}${suffix}`, { bold: true }),
                        this.createTableCell(unit?.learningOutcomes || "-", { size: 16, align: AlignmentType.LEFT }),
                        this.createTableCell(unit?.name || "-", { size: 16 }),
                        this.createTableCell(subUnit?.name || "-", { size: 16 }),
                        // KL
                        this.createTableCell(item.knowledgeLevel === KnowledgeLevel.BASIC ? "1" : ""),
                        this.createTableCell(item.knowledgeLevel === KnowledgeLevel.AVERAGE ? "1" : ""),
                        this.createTableCell(item.knowledgeLevel === KnowledgeLevel.PROFOUND ? "1" : ""),
                        // CP
                        ...Object.values(CognitiveProcess).map(v => this.createTableCell(item.cognitiveProcess === v ? "1" : "")),
                        // Format
                        ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(item.itemFormat === f ? "1" : "")),
                        this.createTableCell(item.totalMarks.toString(), { bold: true }),
                        this.createTableCell("5"), // Placeholder time
                    ]
                });
            };

            if (!item.hasInternalChoice) {
                rows.push(createDataRow());
            } else {
                rows.push(createDataRow("(அ)"));
                rows.push(createDataRow("(ஆ)"));
            }
        });

        const doc = new Document({
            sections: [{
                properties: { page: { size: { orientation: "landscape" as any } } },
                children: [
                    this.createRichParagraph("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 36, align: AlignmentType.CENTER }),
                    this.createRichParagraph("Item-wise Analysis / Scoring Indicators", { bold: true, italic: true, size: 28, color: "FF0080", align: AlignmentType.CENTER }),
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: rows
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Report2_${blueprint.id}.docx`);
    }

    /**
     * Export Answer Key
     */
    static async exportAnswerKey(blueprint: Blueprint, curriculum: Curriculum) {
        const subInfo = this.getSubjectInfo(blueprint.subject);
        const academicYear = this.getAcademicYear(blueprint);
        const termTamil = this.getTermTamil(blueprint.examTerm);
        const setId = (blueprint.setId || 'Set A').replace('Set ', '');
        const qpCode = `T${blueprint.classLevel}${subInfo.code}`;

        // Helper for unit order
        const unitOrderMap = new Map<string, number>();
        curriculum?.units.forEach((u) => {
            unitOrderMap.set(u.id, u.unitNumber);
        });

        const sortedItems = [...blueprint.items].sort((a, b) => {
            const unitA = unitOrderMap.get(a.unitId) || 999;
            const unitB = unitOrderMap.get(b.unitId) || 999;
            if (unitA !== unitB) return unitA - unitB;
            return a.marksPerQuestion - b.marksPerQuestion;
        });

        const rows = [
            new TableRow({
                children: [
                    this.createTableCell("Item/ Qn. No.", { bold: true, shading: GREEN_HEADER, size: 20 }),
                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER, size: 20 }),
                    this.createTableCell("Answer/Value Points", { bold: true, shading: GREEN_HEADER, size: 20 }),
                    this.createTableCell("Further Information", { bold: true, shading: GREEN_HEADER, size: 20 }),
                ]
            })
        ];

        sortedItems.forEach((item, idx) => {
            const cleanText = (html: string) => {
                if (!html) return "(விடை இன்னும் சேர்க்கப்படவில்லை)";
                return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            };

            if (!item.hasInternalChoice) {
                rows.push(new TableRow({
                    children: [
                        this.createTableCell((idx + 1).toString(), { bold: true }),
                        this.createTableCell(item.marksPerQuestion.toString()),
                        this.createTableCell(cleanText(item.answerText || ""), { align: AlignmentType.LEFT }),
                        this.createTableCell(""),
                    ]
                }));
            } else {
                rows.push(new TableRow({
                    children: [
                        this.createTableCell(`${idx + 1}(அ)`, { bold: true }),
                        this.createTableCell(item.marksPerQuestion.toString()),
                        this.createTableCell(cleanText(item.answerText || ""), { align: AlignmentType.LEFT }),
                        this.createTableCell(""),
                    ]
                }));
                rows.push(new TableRow({
                    children: [
                        this.createTableCell(`${idx + 1}(ஆ)`, { bold: true, shading: PURPLE_SOFT }),
                        this.createTableCell(item.marksPerQuestion.toString(), { shading: PURPLE_SOFT }),
                        this.createTableCell(cleanText(item.answerTextB || ""), { align: AlignmentType.LEFT, shading: PURPLE_SOFT }),
                        this.createTableCell("", { shading: PURPLE_SOFT }),
                    ]
                }));
            }
        });

        const doc = new Document({
            sections: [{
                children: [
                    this.createRichParagraph(setId, { bold: true, size: 28 }),
                    this.createRichParagraph("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 36, align: AlignmentType.CENTER }),
                    this.createRichParagraph("Proforma for Scoring Key & Marking Scheme", { bold: true, italic: true, size: 28, color: "FF0080", align: AlignmentType.CENTER }),
                    
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: this.createOfficialHeaderRows(blueprint, 2)
                    }),

                    new Paragraph({ text: "", spacing: { after: 300 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: rows
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `AnswerKey_${blueprint.id}.docx`);
    }

    /**
     * Export Blueprint Matrix (Report 3)
     */
    static async exportReport3(blueprint: Blueprint, curriculum: Curriculum) {
        const setId = (blueprint.setId || 'Set A').replace('Set ', '');
        
        const rows = [
            ...this.createOfficialHeaderRows(blueprint, 20),
            new TableRow({
                children: [this.createTableCell(" ", { size: 1, colSpan: 20 })] // Spacer
            }),
            new TableRow({
                children: [
                    this.createTableCell("Q.No", { rowSpan: 2, bold: true, size: 18, shading: ORANGE_HEADER }),
                    this.createTableCell("LO", { rowSpan: 2, bold: true, size: 18, shading: ORANGE_HEADER }),
                    this.createTableCell("Unit", { rowSpan: 2, bold: true, size: 18, shading: ORANGE_HEADER }),
                    this.createTableCell("Cognitive Process", { colSpan: 7, bold: true, size: 18, shading: ORANGE_HEADER }),
                    this.createTableCell("Level", { colSpan: 3, bold: true, size: 18, shading: ORANGE_HEADER }),
                    this.createTableCell("Question Type", { colSpan: 6, bold: true, size: 18, shading: ORANGE_HEADER }),
                    this.createTableCell("Score", { rowSpan: 2, bold: true, size: 18, shading: ORANGE_HEADER }),
                ]
            }),
            new TableRow({
                children: [
                    ...[1, 2, 3, 4, 5, 6, 7].map(n => this.createTableCell(`CP${n}`, { size: 14, shading: ORANGE_SUBHEADER })),
                    ...["B", "A", "P"].map(l => this.createTableCell(l, { size: 14, shading: ORANGE_SUBHEADER })),
                    ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(f, { size: 14, shading: ORANGE_SUBHEADER })),
                ]
            })
        ];

        blueprint.items.forEach((item, idx) => {
             const unit = curriculum.units.find(u => u.id === item.unitId);
             const createRow = (suffix: string = "") => new TableRow({
                 children: [
                     this.createTableCell(`${idx+1}${suffix}`),
                     this.createTableCell(unit?.learningOutcomes || "-", { size: 14 }),
                     this.createTableCell(unit?.name || "-"),
                     ...Object.values(CognitiveProcess).map(v => this.createTableCell(item.cognitiveProcess === v ? item.totalMarks.toString() : "")),
                     ...Object.values(KnowledgeLevel).map(v => this.createTableCell(item.knowledgeLevel === v ? item.totalMarks.toString() : "")),
                     ...["SR1","SR2","CRS1","CRS2","CRS3","CRL"].map(f => this.createTableCell(item.itemFormat === f ? item.totalMarks.toString() : "")),
                     this.createTableCell(item.totalMarks.toString(), { bold: true }),
                 ]
             });

             if (!item.hasInternalChoice) {
                 rows.push(createRow());
             } else {
                 rows.push(createRow("(அ)"));
                 rows.push(createRow("(ஆ)"));
             }
        });

        const doc = new Document({
            sections: [{
                properties: { page: { size: { orientation: "landscape" as any } } },
                children: [
                    this.createRichParagraph(setId, { bold: true, size: 28 }),
                    this.createRichParagraph("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 36, align: AlignmentType.CENTER }),
                    this.createRichParagraph("Blue Print Matrix", { bold: true, italic: true, size: 28, color: "FF0080", align: AlignmentType.CENTER }),
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Report3_Matrix_${blueprint.id}.docx`);
    }
}
