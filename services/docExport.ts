import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, VerticalAlign, ShadingType, PageBreak } from "docx";
import { saveAs } from "file-saver";
import { Blueprint, Curriculum, KnowledgeLevel, CognitiveProcess, ItemFormat, Unit, BlueprintItem, Discourse } from "../types";

// Helper constants for styling
const BLACK = "000000";
const GREEN_HEADER = "E2EFDA";
const ORANGE_HEADER = "FCE4D6";
const ORANGE_SUBHEADER = "FFF2CC";
const PURPLE_SOFT = "F5E6FF";
const GREY_LIGHT = "F2F2F2";

/**
 * Service to export blueprint reports and answer key to Word document
 */
export class DocExportService {

    private static getItemQuestionCount(item: BlueprintItem) {
        return Math.max(item.questionCount || 1, 1);
    }

    private static getItemTotalScore(item: BlueprintItem) {
        return this.getItemQuestionCount(item) * (item.marksPerQuestion || 0);
    }

    private static getItemTime(item: BlueprintItem) {
        if (item.time !== undefined && item.time !== null && item.time !== 0) return item.time.toString();

        const marks = item.marksPerQuestion || 0;
        if (marks <= 2) return "5";
        if (marks <= 4) return "10";
        return "15";
    }

    private static createTextRuns(text: string, options: { bold?: boolean, size?: number, italic?: boolean, font?: string } = {}) {
        if (!text) return [new TextRun("")];
        
        // Split text by Tamil characters vs others to apply different fonts/sizes
        const segments = text.split(/([அ-ஹ\u0B80-\u0BFF]+)/g).filter(Boolean);
        
        return segments.map(seg => {
            const isTamil = /[அ-ஹ\u0B80-\u0BFF]/.test(seg);
            return new TextRun({
                text: seg,
                bold: options.bold,
                italics: options.italic,
                size: options.size || (isTamil ? 28 : 22),
                font: options.font || (isTamil ? "TAU-Paalai" : "Times New Roman")
            });
        });
    }

    private static createTableCell(text: string, options: {
        bold?: boolean,
        size?: number,
        align?: any,
        rowSpan?: number,
        colSpan?: number,
        shading?: string,
        italic?: boolean,
        font?: string,
        noBorder?: boolean
    } = {}) {
        return new TableCell({
            children: [
                new Paragraph({
                    children: this.createTextRuns(text, options),
                    alignment: options.align || AlignmentType.CENTER,
                    spacing: { before: 100, after: 100 }
                }),
            ],
            rowSpan: options.rowSpan,
            columnSpan: options.colSpan,
            shading: options.shading ? { fill: options.shading, type: ShadingType.CLEAR } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            borders: options.noBorder ? {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
            } : {
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
        italic?: boolean,
        font?: string,
        spacingBefore?: number,
        spacingAfter?: number
    } = {}) {
        return new Paragraph({
            children: this.createTextRuns(text, options),
            alignment: options.align || AlignmentType.LEFT,
            spacing: { 
                before: options.spacingBefore !== undefined ? options.spacingBefore : 100, 
                after: options.spacingAfter !== undefined ? options.spacingAfter : 100 
            }
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
            case 'First Term Summative': return 'முதல்';
            case 'Second Term Summative': return 'இரண்டாம்';
            case 'Third Term Summative': return 'மூன்றாம்';
            default: return 'முதல்';
        }
    }

    private static getSubjectInfo(subject: string) {
        if (subject.includes('AT')) {
            return { tamil: 'தமிழ் முதல் தாள் (AT)', eng: 'First Language - Tamil Paper I', code: '02' };
        }
        return { tamil: 'தமிழ் இரண்டாம் தாள் (BT)', eng: 'First Language - Tamil Paper II', code: '12' };
    }

    private static getPaperCode(blueprint: Blueprint) {
        const subInfo = this.getSubjectInfo(blueprint.subject);
        return `GI${blueprint.classLevel}${subInfo.code}`;
    }

    private static createOfficialHeaderRows(blueprint: Blueprint, totalCols: number = 2) {
        const subInfo = this.getSubjectInfo(blueprint.subject);
        const academicYear = this.getAcademicYear(blueprint);
        const termTamil = this.getTermTamil(blueprint.examTerm);
        const qpCode = this.getPaperCode(blueprint);

        const col1Span = Math.ceil(totalCols * 0.7);
        const col2Span = totalCols - col1Span;

        return [
            new TableRow({
                children: [
                    this.createTableCell(`${termTamil} பருவ தொகுத்தறி மதிப்பீடு ${academicYear}`, { bold: true, size: 24, colSpan: totalCols > 1 ? col1Span : undefined, align: AlignmentType.LEFT }),
                    this.createTableCell(qpCode, { bold: true, size: 24, colSpan: totalCols > 1 ? col2Span : undefined, align: AlignmentType.RIGHT }),
                ]
            }),
            new TableRow({
                children: [
                    this.createTableCell(subInfo.tamil, { bold: true, size: 24, colSpan: totalCols > 1 ? col1Span : undefined, align: AlignmentType.LEFT }),
                    this.createTableCell(subInfo.eng, { bold: true, size: 20, colSpan: totalCols > 1 ? col2Span : undefined, align: AlignmentType.RIGHT }),
                ]
            })
        ];
    }

    /**
     * Export Report 1: Weightage Analysis
     */
    static async exportReport1(blueprint: Blueprint, curriculum: Curriculum) {
        const academicYear = this.getAcademicYear(blueprint);
        const setId = (blueprint.setId || 'Set A').replace('Set ', '');
        const totalScore = blueprint.totalMarks;

        // Stats calculation
        const stats = {
            cp: {} as Record<string, number>,
            kl: {} as Record<string, number>,
            content: {} as Record<string, number>,
            format: {} as Record<string, { count: number, score: number, time: number }>
        };

        // Initialize format stats
        [ItemFormat.SR1, ItemFormat.SR2, ItemFormat.CRS1, ItemFormat.CRS2, ItemFormat.CRL].forEach(f => {
            stats.format[f] = { count: 0, score: 0, time: 0 };
        });

        blueprint.items.forEach(item => {
            const score = this.getItemTotalScore(item);
            stats.content[item.unitId] = (stats.content[item.unitId] || 0) + score;
            stats.kl[item.knowledgeLevel] = (stats.kl[item.knowledgeLevel] || 0) + score;
            stats.cp[item.cognitiveProcess] = (stats.cp[item.cognitiveProcess] || 0) + score;
            
            const fmt = item.itemFormat as ItemFormat;
            if (stats.format[fmt]) {
                stats.format[fmt].count += this.getItemQuestionCount(item);
                stats.format[fmt].score += score;
                stats.format[fmt].time += parseInt(this.getItemTime(item)) || 0;
            }
        });

        const totalInternalChoiceScore = blueprint.items
            .filter(item => item.hasInternalChoice)
            .reduce((sum, item) => sum + this.getItemTotalScore(item), 0);
        const internalChoicePercent = totalScore > 0 ? Math.round((totalInternalChoiceScore / totalScore) * 100) : 0;

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 720, right: 720, bottom: 720, left: 720 }
                    }
                },
                children: [
                    // Page 1 Header
                    this.createRichParagraph("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 36, align: AlignmentType.CENTER }),
                    this.createRichParagraph("Proforma for Analysing Question Paper", { bold: true, size: 32, align: AlignmentType.CENTER }),
                    this.createRichParagraph("Topic/Sub Topic wise Analysis", { bold: true, italic: true, size: 24, color: "FF0080", align: AlignmentType.CENTER }),

                    new Paragraph({ text: "", spacing: { after: 200 } }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            ...this.createOfficialHeaderRows(blueprint, 2),
                            new TableRow({
                                children: [
                                    this.createTableCell(`Std. : ${blueprint.classLevel}`, { bold: true, align: AlignmentType.LEFT }),
                                    this.createTableCell(`Score : ${totalScore} Marks`, { bold: true, align: AlignmentType.RIGHT }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell(`Set : ${setId}`, { bold: true, align: AlignmentType.LEFT }),
                                    this.createTableCell(`Year : ${academicYear}`, { bold: true, align: AlignmentType.RIGHT }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    this.createRichParagraph("PART - I: QUESTION PAPER DESIGN - HS", { bold: true, size: 24, align: AlignmentType.CENTER }),
                    new Paragraph({ text: "", spacing: { before: 200 } }),
                    
                    // Section I
                    this.createRichParagraph("I. Weightage to Content Area", { bold: true, size: 24 }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Sl. No.", { bold: true, shading: GREEN_HEADER, font: "TAU-Paalai" }),
                                    this.createTableCell("Learning Outcomes (LOs)", { bold: true, shading: GREEN_HEADER, font: "TAU-Paalai" }),
                                    this.createTableCell("Unit / Topic", { bold: true, shading: GREEN_HEADER, font: "TAU-Paalai" }),
                                    this.createTableCell("Sub-unit", { bold: true, shading: GREEN_HEADER, font: "TAU-Paalai" }),
                                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER, font: "TAU-Paalai" }),
                                    this.createTableCell("%", { bold: true, shading: GREEN_HEADER, font: "TAU-Paalai" }),
                                ]
                            }),
                            ...curriculum.units.filter(u => (stats.content[u.id] || 0) > 0).map((u, idx) => {
                                const score = stats.content[u.id] || 0;
                                return new TableRow({
                                    children: [
                                        this.createTableCell((idx + 1).toString(), { font: "TAU-Paalai" }),
                                        this.createTableCell(u.learningOutcomes || "-", { align: AlignmentType.LEFT, size: 18, font: "TAU-Paalai" }),
                                        this.createTableCell(u.name, { align: AlignmentType.LEFT, font: "TAU-Paalai" }),
                                        this.createTableCell(u.subUnits.map(s => s.name).join(", "), { align: AlignmentType.LEFT, size: 18, font: "TAU-Paalai" }),
                                        this.createTableCell(score.toString(), { bold: true, font: "TAU-Paalai" }),
                                        this.createTableCell(`${((score / totalScore) * 100).toFixed(0)}%`, { font: "TAU-Paalai" }),
                                    ]
                                });
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("Total", { bold: true, colSpan: 4, shading: GREY_LIGHT, font: "TAU-Paalai" }),
                                    this.createTableCell(totalScore.toString(), { bold: true, shading: GREY_LIGHT, font: "TAU-Paalai" }),
                                    this.createTableCell("100%", { bold: true, shading: GREY_LIGHT, font: "TAU-Paalai" }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    
                    // Section II
                    this.createRichParagraph("II. Weightage to Cognitive Process", { bold: true, size: 24 }),
                    new Table({
                        width: { size: 80, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Sl. No.", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Cognitive Process", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Percentage", { bold: true, shading: GREEN_HEADER }),
                                ]
                            }),
                            ...Object.values(CognitiveProcess).map((value, idx) => {
                                const score = stats.cp[value] || 0;
                                return new TableRow({
                                    children: [
                                        this.createTableCell(`CP${idx + 1}`),
                                        this.createTableCell(value, { align: AlignmentType.LEFT }),
                                        this.createTableCell(score > 0 ? score.toString() : "-"),
                                        this.createTableCell(score > 0 ? `${((score / totalScore) * 100).toFixed(1)}%` : "-"),
                                    ]
                                });
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("Total", { bold: true, colSpan: 2, shading: GREY_LIGHT }),
                                    this.createTableCell(totalScore.toString(), { bold: true, shading: GREY_LIGHT }),
                                    this.createTableCell("100%", { bold: true, shading: GREY_LIGHT }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),

                    // Section III
                    this.createRichParagraph("III. Weightage to Knowledge Level", { bold: true, size: 24 }),
                    new Table({
                        width: { size: 80, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Sl. No.", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Knowledge Level", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER }),
                                    this.createTableCell("Percentage", { bold: true, shading: GREEN_HEADER }),
                                ]
                            }),
                            ...Object.values(KnowledgeLevel).map((value, idx) => {
                                const score = stats.kl[value] || 0;
                                return new TableRow({
                                    children: [
                                        this.createTableCell((idx + 1).toString()),
                                        this.createTableCell(value, { align: AlignmentType.LEFT }),
                                        this.createTableCell(score > 0 ? score.toString() : "-"),
                                        this.createTableCell(score > 0 ? `${((score / totalScore) * 100).toFixed(0)}%` : "-"),
                                    ]
                                });
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("Total", { bold: true, colSpan: 2, shading: GREY_LIGHT }),
                                    this.createTableCell(totalScore.toString(), { bold: true, shading: GREY_LIGHT }),
                                    this.createTableCell("100%", { bold: true, shading: GREY_LIGHT }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ children: [new PageBreak()] }),

                    // Page 2: Section IV
                    this.createRichParagraph("IV. Weightage to Item Format", { bold: true, size: 24 }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Sl. No.", { bold: true, shading: ORANGE_HEADER }),
                                    this.createTableCell("Item Format", { bold: true, shading: ORANGE_HEADER }),
                                    this.createTableCell("Code", { bold: true, shading: ORANGE_HEADER }),
                                    this.createTableCell("No. of Items", { bold: true, shading: ORANGE_HEADER }),
                                    this.createTableCell("Time (min)", { bold: true, shading: ORANGE_HEADER }),
                                    this.createTableCell("Score", { bold: true, shading: ORANGE_HEADER }),
                                    this.createTableCell("%", { bold: true, shading: ORANGE_HEADER }),
                                ]
                            }),
                            ...[
                                { label: "SR Item (MCI)", code: "SR1" },
                                { label: "SR Item (MI)", code: "SR2" },
                                { label: "CRS Item (VSA)", code: "CRS1" },
                                { label: "CRS Item (SA)", code: "CRS2" },
                                { label: "CRL Item (E)", code: "CRL" },
                            ].map((fmt, idx) => {
                                const fStat = stats.format[fmt.code as ItemFormat] || { count: 0, score: 0, time: 0 };
                                return new TableRow({
                                    children: [
                                        this.createTableCell((idx + 1).toString()),
                                        this.createTableCell(fmt.label, { align: AlignmentType.LEFT }),
                                        this.createTableCell(fmt.code, { bold: true }),
                                        this.createTableCell(fStat.count > 0 ? fStat.count.toString() : "-"),
                                        this.createTableCell(fStat.time > 0 ? fStat.time.toString() : "-"),
                                        this.createTableCell(fStat.score > 0 ? fStat.score.toString() : "-", { bold: true }),
                                        this.createTableCell(fStat.score > 0 ? `${((fStat.score / totalScore) * 100).toFixed(0)}%` : "-"),
                                    ]
                                });
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("Total", { bold: true, colSpan: 3, shading: GREY_LIGHT }),
                                    this.createTableCell(blueprint.items.reduce((s, it) => s + this.getItemQuestionCount(it), 0).toString(), { bold: true, shading: GREY_LIGHT }),
                                    this.createTableCell(blueprint.items.reduce((s, it) => s + (parseInt(this.getItemTime(it)) || 0), 0).toString(), { bold: true, shading: GREY_LIGHT }),
                                    this.createTableCell(totalScore.toString(), { bold: true, shading: GREY_LIGHT }),
                                    this.createTableCell("100%", { bold: true, shading: GREY_LIGHT }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 200 } }),

                    // Abbreviation Index Table
                    new Table({
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
                                    this.createTableCell("Index of Abbreviations:", { 
                                        bold: true, size: 18, align: AlignmentType.LEFT, noBorder: true 
                                    }),
                                    this.createTableCell("", { noBorder: true }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("SR - Selected Response\nCRS - Constructed Response Short Answer\nCRL - Constructed Response Long Answer", { 
                                        size: 18, align: AlignmentType.LEFT, noBorder: true 
                                    }),
                                    this.createTableCell("MCI - Multiple Choice Items\nMI - Matching Item\nVSA - Very Short Answer\nSA - Short Answer\nE - Essay", { 
                                        size: 18, align: AlignmentType.LEFT, noBorder: true 
                                    }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),

                    // Section V
                    this.createRichParagraph("V. Scheme of Sections", { bold: true, size: 24 }),
                    new Paragraph({ text: "Details of sections and choice pattern will be as per the question paper design.", spacing: { before: 100, after: 200 } }),

                    // Section VI
                    this.createRichParagraph("VI. Pattern of Options", { bold: true, size: 24 }),
                    new Table({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell("Internal Choice", { bold: true, align: AlignmentType.LEFT }),
                                    this.createTableCell(totalInternalChoiceScore > 0 ? `Yes (${internalChoicePercent}%)` : "No"),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("Overall Choice", { bold: true, align: AlignmentType.LEFT }),
                                    this.createTableCell("-"),
                                ]
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
                acc[key] = {
                    ...item,
                    questionCount: this.getItemQuestionCount(item),
                    totalMarks: this.getItemTotalScore(item)
                };
            } else {
                acc[key].questionCount += this.getItemQuestionCount(item);
                acc[key].totalMarks += this.getItemTotalScore(item);
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
                    this.createTableCell("Item/ Qn. No.", { rowSpan: 2, shading: ORANGE_HEADER, size: 18, bold: true }),
                    this.createTableCell("Content Area", { colSpan: 3, shading: ORANGE_HEADER, size: 18, bold: true }),
                    this.createTableCell("Knowledge level", { colSpan: 3, shading: ORANGE_HEADER, size: 18, bold: true }),
                    this.createTableCell("Cognitive Process", { colSpan: 7, shading: ORANGE_HEADER, size: 18, bold: true }),
                    this.createTableCell("Item Format", { colSpan: 6, shading: ORANGE_HEADER, size: 18, bold: true }),
                    this.createTableCell("Score", { rowSpan: 2, shading: ORANGE_HEADER, size: 18, bold: true }),
                    this.createTableCell("Time", { rowSpan: 2, shading: ORANGE_HEADER, size: 18, bold: true }),
                ]
            }),
            // Header Row 2
            new TableRow({
                children: [
                    this.createTableCell("LO", { shading: ORANGE_SUBHEADER, size: 16, bold: true }),
                    this.createTableCell("Unit", { shading: ORANGE_SUBHEADER, size: 16, bold: true }),
                    this.createTableCell("Sub-Unit", { shading: ORANGE_SUBHEADER, size: 16, bold: true }),
                    this.createTableCell("B", { shading: ORANGE_SUBHEADER, size: 16, bold: true }),
                    this.createTableCell("A", { shading: ORANGE_SUBHEADER, size: 16, bold: true }),
                    this.createTableCell("P", { shading: ORANGE_SUBHEADER, size: 16, bold: true }),
                    ...[1, 2, 3, 4, 5, 6, 7].map(n => this.createTableCell(`CP${n}`, { shading: ORANGE_SUBHEADER, size: 14, bold: true })),
                    ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(f, { shading: ORANGE_SUBHEADER, size: 14, bold: true })),
                ]
            })
        ];

        sortedGroups.forEach((item, idx) => {
            const unit = curriculum.units.find(u => u.id === item.unitId);
            const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);

            const createDataRow = (
                suffix: string = "",
                metadata: {
                    knowledgeLevel: KnowledgeLevel;
                    cognitiveProcess: CognitiveProcess;
                    itemFormat: string;
                } = {
                        knowledgeLevel: item.knowledgeLevel,
                        cognitiveProcess: item.cognitiveProcess,
                        itemFormat: item.itemFormat
                    }
            ) => {
                return new TableRow({
                    children: [
                        this.createTableCell(`${idx + 1}${suffix}`, { bold: true }),
                        this.createTableCell(unit?.learningOutcomes || "-", { size: 16, align: AlignmentType.LEFT }),
                        this.createTableCell(unit?.name || "-", { size: 16, align: AlignmentType.LEFT }),
                        this.createTableCell(subUnit?.name || "-", { size: 16, align: AlignmentType.LEFT }),
                        // KL
                        this.createTableCell(metadata.knowledgeLevel === KnowledgeLevel.BASIC ? item.questionCount.toString() : ""),
                        this.createTableCell(metadata.knowledgeLevel === KnowledgeLevel.AVERAGE ? item.questionCount.toString() : ""),
                        this.createTableCell(metadata.knowledgeLevel === KnowledgeLevel.PROFOUND ? item.questionCount.toString() : ""),
                        // CP
                        ...Object.values(CognitiveProcess).map(v => this.createTableCell(metadata.cognitiveProcess === v ? item.questionCount.toString() : "")),
                        // Format
                        ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(metadata.itemFormat === f ? item.questionCount.toString() : "")),
                        this.createTableCell(item.totalMarks.toString(), { bold: true }),
                        this.createTableCell(this.getItemTime(item)),
                    ]
                });
            };

            if (!item.hasInternalChoice) {
                rows.push(createDataRow());
            } else {
                rows.push(createDataRow("(அ)"));
                rows.push(createDataRow("(ஆ)", {
                    knowledgeLevel: item.knowledgeLevelB || item.knowledgeLevel,
                    cognitiveProcess: item.cognitiveProcessB || item.cognitiveProcess,
                    itemFormat: item.itemFormatB || item.itemFormat
                }));
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
     * Export Report 3: Blueprint Matrix
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
                    ...[1, 2, 3, 4, 5, 6, 7].map(n => this.createTableCell(`CP${n}`, { size: 14, shading: ORANGE_SUBHEADER, bold: true })),
                    ...["B", "A", "P"].map(l => this.createTableCell(l, { size: 14, shading: ORANGE_SUBHEADER, bold: true })),
                    ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(f, { size: 14, shading: ORANGE_SUBHEADER, bold: true })),
                ]
            })
        ];

        blueprint.items.forEach((item, idx) => {
            const unit = curriculum.units.find(u => u.id === item.unitId);
            const rowScore = this.getItemTotalScore(item);
            const createRow = (
                suffix: string = "",
                metadata: {
                    cognitiveProcess: CognitiveProcess;
                    knowledgeLevel: KnowledgeLevel;
                    itemFormat: string;
                } = {
                        cognitiveProcess: item.cognitiveProcess,
                        knowledgeLevel: item.knowledgeLevel,
                        itemFormat: item.itemFormat
                    }
            ) => new TableRow({
                children: [
                    this.createTableCell(`${idx + 1}${suffix}`, { bold: true }),
                    this.createTableCell(unit?.learningOutcomes || "-", { size: 14, align: AlignmentType.LEFT }),
                    this.createTableCell(unit?.name || "-", { align: AlignmentType.LEFT }),
                    ...Object.values(CognitiveProcess).map(v => this.createTableCell(metadata.cognitiveProcess === v ? rowScore.toString() : "")),
                    ...Object.values(KnowledgeLevel).map(v => this.createTableCell(metadata.knowledgeLevel === v ? rowScore.toString() : "")),
                    ...["SR1", "SR2", "CRS1", "CRS2", "CRS3", "CRL"].map(f => this.createTableCell(metadata.itemFormat === f ? rowScore.toString() : "")),
                    this.createTableCell(rowScore.toString(), { bold: true }),
                ]
            });

            if (!item.hasInternalChoice) {
                rows.push(createRow());
            } else {
                rows.push(createRow("(அ)"));
                rows.push(createRow("(ஆ)", {
                    cognitiveProcess: item.cognitiveProcessB || item.cognitiveProcess,
                    knowledgeLevel: item.knowledgeLevelB || item.knowledgeLevel,
                    itemFormat: item.itemFormatB || item.itemFormat
                }));
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

    /**
     * Export Answer Key
     */
    static async exportAnswerKey(blueprint: Blueprint, curriculum: Curriculum, discourses: Discourse[] = []) {
        const subInfo = this.getSubjectInfo(blueprint.subject);
        const academicYear = this.getAcademicYear(blueprint);
        const termTamil = this.getTermTamil(blueprint.examTerm);
        const setId = (blueprint.setId || 'Set A').replace('Set ', '').trim().charAt(0).toUpperCase();
        const qpCode = this.getPaperCode(blueprint);

        // Sort items: Marks Ascending -> Unit Order Ascending
        const unitOrderMap = new Map<string, number>();
        curriculum?.units.forEach((u) => {
            unitOrderMap.set(u.id, u.unitNumber);
        });

        const sortedItems = [...blueprint.items].sort((a, b) => {
            if (a.marksPerQuestion !== b.marksPerQuestion) {
                return a.marksPerQuestion - b.marksPerQuestion;
            }
            const unitA = unitOrderMap.get(a.unitId) || 999;
            const unitB = unitOrderMap.get(b.unitId) || 999;
            return unitA - unitB;
        });

        const cleanHtml = (html: string) => {
            if (!html) return "";
            return html
                .replace(/<p[^>]*>/g, "")
                .replace(/<\/p>/g, "\n")
                .replace(/<br\s*\/?>/g, "\n")
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .trim();
        };

        const renderItemAnswerForWord = (item: BlueprintItem, isOptionB = false) => {
            const enableInput = isOptionB ? item.enableInputAnswerB : item.enableInputAnswer;
            const structured = isOptionB ? item.structuredAnswersB : item.structuredAnswers;
            const writeContent = isOptionB ? item.answerTextB : item.answerText;
            const enableWrite = isOptionB ? item.enableWriteContentB : item.enableWriteContent;
            const enableDiscourse = isOptionB ? item.enableDiscourseB : item.enableDiscourse;
            const discourseId = isOptionB ? item.discourseIdB : item.discourseId;

            let textParts: string[] = [];

            // 1. Write Content
            if (enableWrite && writeContent && writeContent.trim()) {
                const cleaned = cleanHtml(writeContent);
                if (cleaned) textParts.push(cleaned);
            }

            // 2. Discourse
            if (enableDiscourse && discourseId && discourses.length > 0) {
                const d = discourses.find(x => x.id === discourseId);
                if (d) {
                    textParts.push(`Discourse: ${d.name}`);
                    if (d.description) textParts.push(cleanHtml(d.description));
                    if (d.rubrics && d.rubrics.length > 0) {
                        d.rubrics.forEach(r => {
                            textParts.push(`- ${r.point}: ${r.marks} Marks`);
                        });
                    }
                }
            }

            // 3. Structured Answers
            if (enableInput && structured && structured.length > 0) {
                structured.forEach(v => {
                    textParts.push(`- ${v.answer}: ${v.mark} Marks`);
                });
            }

            return textParts.join("\n\n");
        };

        const rows = [
            new TableRow({
                children: [
                    this.createTableCell("Item / Qn No", { bold: true, shading: GREEN_HEADER, size: 18 }),
                    this.createTableCell("Score", { bold: true, shading: GREEN_HEADER, size: 18 }),
                    this.createTableCell("Answer / Value Points", { bold: true, shading: GREEN_HEADER, size: 18 }),
                    this.createTableCell("Further Information", { bold: true, shading: GREEN_HEADER, size: 18 }),
                ]
            })
        ];

        sortedItems.forEach((item, idx) => {
            const answer = renderItemAnswerForWord(item);
            const furtherInfo = item.enableFurtherInfo ? cleanHtml(item.furtherInfo || "") : "";

            if (!item.hasInternalChoice) {
                rows.push(new TableRow({
                    children: [
                        this.createTableCell((idx + 1).toString(), { bold: true }),
                        this.createTableCell(item.marksPerQuestion.toString(), { bold: true }),
                        this.createTableCell(answer || "(விடை இன்னும் சேர்க்கப்படவில்லை)", { align: AlignmentType.LEFT }),
                        this.createTableCell(furtherInfo || "-", { align: AlignmentType.LEFT, size: 18 }),
                    ]
                }));
            } else {
                rows.push(new TableRow({
                    children: [
                        this.createTableCell(`${idx + 1}(அ)`, { bold: true }),
                        this.createTableCell(item.marksPerQuestion.toString(), { bold: true }),
                        this.createTableCell(answer || "(விடை இன்னும் சேர்க்கப்படவில்லை)", { align: AlignmentType.LEFT }),
                        this.createTableCell(furtherInfo || "-", { align: AlignmentType.LEFT, size: 18 }),
                    ]
                }));
                const answerB = renderItemAnswerForWord(item, true);
                const furtherInfoB = item.enableFurtherInfoB ? cleanHtml(item.furtherInfoB || "") : "";
                rows.push(new TableRow({
                    children: [
                        this.createTableCell(`${idx + 1}(ஆ)`, { bold: true, shading: PURPLE_SOFT }),
                        this.createTableCell(item.marksPerQuestion.toString(), { bold: true, shading: PURPLE_SOFT }),
                        this.createTableCell(answerB || "(விடை இன்னும் சேர்க்கப்படவில்லை)", { align: AlignmentType.LEFT, shading: PURPLE_SOFT }),
                        this.createTableCell(furtherInfoB || "-", { align: AlignmentType.LEFT, size: 18, shading: PURPLE_SOFT }),
                    ]
                }));
            }
        });

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 720, right: 720, bottom: 720, left: 720 }
                    }
                },
                children: [
                    // Answer Key Header
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell(setId, { bold: true, size: 40, noBorder: false, rowSpan: 2 }),
                                    this.createTableCell("சமக்ர சிக்ஷா கேரளம்", { bold: true, size: 36, noBorder: true, colSpan: 2 }),
                                    this.createTableCell(qpCode, { bold: true, size: 24, shading: BLACK, font: "Inter", align: AlignmentType.RIGHT, rowSpan: 2 }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("Answer Key & Scoring Indicators", { bold: true, size: 24, noBorder: true, colSpan: 2 }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    this.createTableCell("", { noBorder: true }),
                                    this.createTableCell(`${termTamil} பருவத் தொகுத்தறி மதிப்பீடு ${academicYear}`, { bold: true, size: 28, noBorder: true, colSpan: 2 }),
                                    this.createTableCell("", { noBorder: true }),
                                ]
                            })
                        ]
                    }),

                    this.createRichParagraph(subInfo.tamil, { bold: true, size: 28, align: AlignmentType.CENTER, spacingBefore: 200, spacingAfter: 50 }),
                    this.createRichParagraph(subInfo.eng, { bold: true, size: 22, align: AlignmentType.CENTER, spacingBefore: 50, spacingAfter: 200 }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableCell(`நேரம்: 90 நிமிடம்`, { align: AlignmentType.LEFT, noBorder: true }),
                                    this.createTableCell(`மதிப்பெண்: ${blueprint.totalMarks}`, { align: AlignmentType.RIGHT, noBorder: true }),
                                ]
                            })
                        ]
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
}

