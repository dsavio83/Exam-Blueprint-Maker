import React from 'react';
import { FileText } from 'lucide-react';
import { Blueprint, BlueprintItem, Curriculum, Unit, Discourse } from '../types';

interface AnswerKeyViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum | null;
    discourses?: Discourse[];
    isPdf?: boolean;
}

const AnswerKeyView = ({ blueprint, curriculum, discourses = [], isPdf = false }: AnswerKeyViewProps) => {
    // Returns plain string – safe to embed inside HTML template literals
    const formatMarksStr = (marks: number): string => {
        const s = marks.toString().replace(/M$/, '');
        if (s.endsWith('.5')) {
            const whole = s.split('.')[0];
            return whole === '0' ? '½' : `${whole}½`;
        }
        return s;
    };

    // Returns JSX – use only inside React render tree
    const formatMarks = (marks: number) => (
        <span className="english-font" style={{ fontFamily: "'Times New Roman', serif" }}>
            {formatMarksStr(marks)}
        </span>
    );

    const renderMixedText = (text: string | undefined | null) => {
        if (!text) return '-';
        // Split by Tamil characters vs others (English/Numbers/Symbols)
        const segments = text.toString().split(/([அ-ஹ\u0B80-\u0BFF]+)/);

        return segments.map((seg, i) => {
            if (!seg) return null;
            const isTamil = /[அ-ஹ\u0B80-\u0BFF]/.test(seg);
            return (
                <span
                    key={i}
                    className={isTamil ? "tamil-font" : "english-font"}
                    style={{
                        fontFamily: isTamil ? `'TAU-Paalai', 'Latha', serif` : `'Times New Roman', serif`,
                        fontSize: isTamil ? 'inherit' : 'inherit',
                        lineHeight: isTamil ? '1.4' : '1.2'
                    }}
                >
                    {seg}
                </span>
            );
        });
    };

    const wrapEnglishAndNumbers = (value: string) =>
        value.replace(/([A-Za-z0-9][A-Za-z0-9\s/().:&-]*)/g, '<span class="english-font">$1</span>');

    const normalizeAnswerHtml = (html?: string) => {
        if (!html) return '';
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html
            .replace(/&nbsp;/g, ' ') // Convert nbsp to space first for cleaner processing
            .replace(/(\d+)\.5/g, '$1½')
            .replace(/(^|[^0-9])0\.5/g, '$1½')
            .replace(/(\d+(?:\.\d+)?)M\b/g, '$1');



        wrapper.querySelectorAll('ul').forEach((ul) => {
            if (!ul.classList.contains('rubric-list')) ul.classList.add('rubric-list');
        });

        wrapper.querySelectorAll('p, li, span, strong, b').forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (node.children.length > 0 && !node.classList.contains('rubric-mark') && !node.classList.contains('rubric-point') && !node.classList.contains('mark-indicator')) return;
            if (node.classList.contains('english-font')) return;

            // For mark-indicator, just wrap the numbers if any
            if (node.classList.contains('mark-indicator')) {
                node.innerHTML = wrapEnglishAndNumbers(node.innerHTML.trim());
                return;
            }

            node.innerHTML = wrapEnglishAndNumbers(node.innerHTML);
        });

        wrapper.querySelectorAll('li').forEach((li) => {
            const pTags = li.querySelectorAll('p');
            if (pTags.length > 0) {
                let text = '';
                pTags.forEach(p => { text += p.innerHTML + ' '; });
                li.innerHTML = text.trim();
            }

            if (li.querySelector('.rubric-point')) return;

            const text = (li.textContent || '')
                .replace(/0\.5M/g, '½')
                .replace(/(\d+(?:\.\d+)?)M\b/g, '$1')
                .trim();

            const match = text.match(/^(.*?)(?:\s*-\s*|\s+)(½|\d+(?:\.\d+)?)$/);
            if (match) {
                li.innerHTML = `<span class="rubric-point">${wrapEnglishAndNumbers(match[1].trim())}</span><strong class="rubric-mark english-font">${match[2]}</strong>`;
            }
        });

        return wrapper.innerHTML;
    };

    const renderFurtherInfo = (text?: string) => {
        if (!text) return null;

        // If the text already looks like HTML (has tags), just render it.
        // Otherwise, split by newline and wrap English/Numbers.
        const hasTags = /<[a-z][\s\S]*>/i.test(text);

        if (hasTags) {
            return <div className="html-content" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
        }

        const processed = text.split('\n').map(line => wrapEnglishAndNumbers(line)).join('<br />');
        return <div dangerouslySetInnerHTML={{ __html: processed }} />;
    };

    const renderItemAnswer = (item: BlueprintItem, isOptionB = false) => {
        const enableInput = isOptionB ? item.enableInputAnswerB : item.enableInputAnswer;
        const structured = isOptionB ? item.structuredAnswersB : item.structuredAnswers;
        const writeContent = isOptionB ? item.answerTextB : item.answerText;
        const enableWrite = isOptionB ? item.enableWriteContentB : item.enableWriteContent;
        const enableDiscourse = isOptionB ? item.enableDiscourseB : item.enableDiscourse;
        const discourseId = isOptionB ? item.discourseIdB : item.discourseId;

        const htmlParts: string[] = [];

        // 1. Write Content (First priority)
        if (enableWrite && writeContent && writeContent.trim()) {
            const plainText = writeContent.replace(/<[^>]*>/g, '').trim();
            if (plainText.length > 0 || writeContent.includes('<img')) {
                htmlParts.push(`<div class="write-content-section">${writeContent}</div>`);
            }
        }

        // 2. Discourse Details (Second priority)
        if (enableDiscourse && discourseId && discourses.length > 0) {
            const d = discourses.find(x => x.id === discourseId);
            if (d) {
                let dHtml = `<p><b>${d.name}</b></p>`;
                dHtml += `<div class="discourse-details">`;

                const normalizedDescription = (d.description || '').trim();
                const dedupedDescription = normalizedDescription.toLowerCase().startsWith(d.name.trim().toLowerCase())
                    ? normalizedDescription.slice(d.name.trim().length).trim().replace(/^[:\-–]\s*/, '')
                    : normalizedDescription;

                if (dedupedDescription) dHtml += `<p>${dedupedDescription}</p>`;

                if (d.rubrics && d.rubrics.length > 0) {
                    dHtml += `<ul class="rubric-list">`;
                    d.rubrics.forEach(r => {
                        dHtml += `<li><span class="rubric-point">${r.point}</span><strong class="rubric-mark english-font">${formatMarksStr(r.marks)}</strong></li>`;
                    });
                    dHtml += `</ul>`;
                }
                dHtml += `</div>`;
                htmlParts.push(dHtml);
            }
        }

        // 3. Input Answer (Third priority)
        if (enableInput && structured && structured.length > 0) {
            const sHtml = `<ul class="rubric-list">` +
                structured.map(v => `<li><span class="rubric-point">${v.answer}</span><strong class="rubric-mark english-font">${v.mark}</strong></li>`).join('') +
                `</ul>`;
            htmlParts.push(sHtml);
        }

        if (htmlParts.length === 0) return '';

        const finalHtml = htmlParts.join('<div class="my-2 border-t border-dashed opacity-20"></div>');
        return normalizeAnswerHtml(finalHtml);
    };


    // Helper for unit order
    const unitOrderMap = new Map<string, number>();
    curriculum?.units.forEach((u: Unit) => {
        unitOrderMap.set(u.id, u.unitNumber);
    });

    // Sort items: Marks Ascending -> Unit Order Ascending
    const sortedItems = [...blueprint.items].sort((a, b) => {
        if (a.marksPerQuestion !== b.marksPerQuestion) {
            return a.marksPerQuestion - b.marksPerQuestion;
        }
        const unitA = unitOrderMap.get(a.unitId) || 999;
        const unitB = unitOrderMap.get(b.unitId) || 999;
        return unitA - unitB;
    });

    // Helper functions synced with ReportsView
    const getPaperCode = () => {
        const subject = blueprint.subject.includes('BT') ? 'BT' : 'AT';
        const codeMap: Record<string, string> = {
            '10-AT': 'GI1002',
            '10-BT': 'GI1012',
            '9-AT': 'GI902',
            '9-BT': 'GI912',
            '8-AT': 'GI802',
            '8-BT': 'GI812'
        };
        return codeMap[`${blueprint.classLevel}-${subject}`] || `GI${blueprint.classLevel}${subject === 'AT' ? '02' : '12'}`;
    };

    const getSubjectTitle = () => {
        if (blueprint.subject.includes('AT')) {
            return { tamil: 'தமிழ் முதல் தாள்', eng: 'Tamil Language Paper I (AT)' };
        }
        return { tamil: 'தமிழ் இரண்டாம் தாள்', eng: 'Tamil Language Paper II (BT)' };
    };

    const getTermHeading = () => {
        const year = academicYear.replace(/^(\d{4})-(\d{2,4})$/, (_, start, end) => `${start}-${String(end).slice(-2)}`);
        switch (blueprint.examTerm) {
            case 'First Term Summative': return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
            case 'Second Term Summative': return `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
            case 'Third Term Summative': return `இறுதிப் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
            default: return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
        }
    };

    const getAcademicYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed: 0=Jan, 11=Dec

        // Jan (0) to May (4) -> (Year-1)-(Year)
        // June (5) to Dec (11) -> (Year)-(Year+1)
        if (month <= 4) {
            return `${year - 1}-${year}`;
        } else {
            return `${year}-${year + 1}`;
        }
    };

    const academicYear = blueprint.academicYear || getAcademicYear();
    const paperCode = getPaperCode();
    const subjectTitle = getSubjectTitle();
    const termHeading = getTermHeading();
    const setLetter = (blueprint.setId || 'A').replace(/SET\s+/i, '').trim().charAt(0).toUpperCase();

    return (
        <div className={isPdf ? 'bg-white' : 'bg-white paper-container max-w-[210mm] mx-auto'}>
            <div className="mb-3">
                <div className="border-b-2 border-black pb-1">
                    <div className="relative flex items-center justify-center py-0.5">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            <div className="border-2 border-black w-10 h-10 flex items-center justify-center font-bold text-[20px] english-font leading-none">
                                {setLetter}
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-[20px] text-black font-bold uppercase tracking-tight leading-none" style={{ fontFamily: "'TAU-Urai', serif" }}>
                                சமக்ர சிக்ஷா கேரளம்
                            </h1>
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                            <div className="bg-black text-white px-5 py-1.5 rounded-full text-[13px] font-bold english-font leading-none text-center min-w-[70px] border border-black shadow-sm">
                                {paperCode}
                            </div>
                        </div>
                    </div>

                    <div className="text-center -mt-0.5">
                        <h1 className="text-[17px] font-bold tamil-heading-font text-black uppercase leading-tight">
                            Answer Key & Scoring Indicators
                        </h1>
                    </div>

                    <div className="text-center -mt-0.5">
                        <h2 className="text-[16px] font-bold text-black tamil-font leading-tight">{termHeading}</h2>
                    </div>

                    <div className="flex flex-col items-center">
                        <h2 className="text-[16px] font-bold text-black tamil-font leading-snug">{subjectTitle.tamil}</h2>
                        <h3 className="text-[14px] font-bold text-black english-font leading-snug">{subjectTitle.eng}</h3>
                    </div>

                    <div className="flex justify-between items-end text-black font-bold pt-0.5">
                        <div className="text-[12px]">
                            <div className="tamil-font leading-none">நேரம்: <span className="english-font font-bold">90</span> நிமிடம்</div>
                            <div className="tamil-font leading-none py-1">சிந்தனை நேரம் : <span className="english-font font-bold">15</span> நிமிடம்</div>
                        </div>
                        <div className="text-right text-[12px]">
                            <div className="tamil-font leading-none">வகுப்பு: <span className="english-font font-bold">{blueprint.classLevel}</span></div>
                            <div className="tamil-font leading-none py-1">மதிப்பெண்: <span className="english-font font-bold">{formatMarks(blueprint.totalMarks)}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Answer Key Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-white text-black">
                            <th className="border border-black p-1.5 text-sm font-bold w-16 text-center english-font">Item /<br />Qn No</th>
                            <th className="border border-black p-1.5 text-sm font-bold w-12 text-center english-font">Score</th>
                            <th className="border border-black p-1.5 text-sm font-bold text-center english-font">Answer / Value Points</th>
                            <th className="border border-black p-1.5 text-sm font-bold w-32 text-center english-font">Further Information</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map((item, index) => {
                            if (!item.hasInternalChoice) {
                                // Normal single row
                                const answerHtml = renderItemAnswer(item);
                                return (
                                    <tr key={item.id} className="min-h-[40px] text-black">
                                        <td className="border border-black p-1 text-center font-bold english-font">{index + 1}</td>
                                        <td className="border border-black p-1 text-center font-bold english-font">{formatMarks(item.marksPerQuestion)}</td>
                                        <td className="border border-black p-1 text-left">
                                            <div className="tamil-font leading-tight">
                                                {answerHtml ? (
                                                    <div className="answer-key-content" dangerouslySetInnerHTML={{ __html: answerHtml }} />
                                                ) : (
                                                    <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-1 align-top text-black">
                                            <div className="tamil-font text-xs leading-tight whitespace-pre-wrap">
                                                {item.enableFurtherInfo && renderFurtherInfo(item.furtherInfo)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }

                            const answerHtmlA = renderItemAnswer(item);
                            const answerHtmlB = renderItemAnswer(item, true);
                            return (
                                <React.Fragment key={item.id}>
                                    <tr className="min-h-[40px] text-black">
                                        <td className="border border-black p-1 text-center font-bold">
                                            <span className="english-font">{index + 1}</span><span className="tamil-font font-bold ml-1 text-[13px]">(அ)</span>
                                        </td>
                                        <td className="border border-black p-1 text-center font-bold english-font">{formatMarks(item.marksPerQuestion)}</td>
                                        <td className="border border-black p-1 text-left">
                                            <div className="tamil-font leading-tight">
                                                {answerHtmlA ? (
                                                    <div className="answer-key-content" dangerouslySetInnerHTML={{ __html: answerHtmlA }} />
                                                ) : (
                                                    <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-1 align-top text-black">
                                            <div className="tamil-font text-xs leading-tight whitespace-pre-wrap">
                                                {item.enableFurtherInfo && renderFurtherInfo(item.furtherInfo)}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="min-h-[40px] text-black">
                                        <td className="border border-black p-1 text-center font-bold">
                                            <span className="english-font">{index + 1}</span><span className="tamil-font font-bold ml-1 text-[13px]">(ஆ)</span>
                                        </td>
                                        <td className="border border-black p-1 text-center font-bold english-font">{formatMarks(item.marksPerQuestion)}</td>
                                        <td className="border border-black p-1 text-left">
                                            <div className="tamil-font leading-tight">
                                                {answerHtmlB ? (
                                                    <div className="answer-key-content" dangerouslySetInnerHTML={{ __html: answerHtmlB }} />
                                                ) : (
                                                    <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-1 align-top text-black">
                                            <div className="tamil-font text-xs leading-tight whitespace-pre-wrap">
                                                {item.enableFurtherInfoB && renderFurtherInfo(item.furtherInfoB)}
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Print specific styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    body {
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .paper-container {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 0 !important;
                        margin-top: 5px !important;
                    }
                }
                .tamil-font {
                    font-family: 'TAU-Paalai', 'Noto Serif', serif;
                    font-size: 14pt;
                    line-height: 1.05;
                }
                .tamil-heading-font {
                    font-family: 'TAU-Paalai', 'TAU-Urai Bold', 'TAU-Urai', serif;
                    font-weight: 700;
                    font-size: 16px;
                }
                .english-font {
                    font-family: 'Times New Roman', 'Times', serif;
                }
                .answer-key-content {
                    width: 100%;
                    font-family: 'Times New Roman', 'TAU-Paalai', serif;
                }
                .answer-key-content p {
                    margin: 0 0 0.1rem 0;
                }
                .rubric-mark {
                    font-weight: bold;
                    min-width: 1.5rem;
                    text-align: right;
                    color: #000;
                    line-height: 1.4;
                    margin-left: 6px;
                    display: inline-block;
                }
                .mark-indicator {
                    float: right;
                    min-width: 18px;
                    text-align: right;
                    font-weight: bold;
                    margin-left: 4px;
                    display: inline-block;
                    font-family: 'Times New Roman', 'Times', serif;
                    line-height: 1.1;
                    color: #000;
                }
                .rubric-list {
                    list-style: none !important;
                    list-style-type: none !important;
                    padding-left: 1.25rem !important;
                    margin: 0 !important;
                    width: 100%;
                }
                .rubric-list li {
                    display: flex !important;
                    align-items: flex-start !important;
                    gap: 0.4rem !important;
                    padding: 0.02rem 0 !important;
                    width: 100%;
                    position: relative;
                    list-style: none !important;
                    list-style-type: none !important;
                }
                .rubric-list li::before {
                    content: none !important;
                    display: none !important;
                }
                .discourse-details {
                    margin-left: 1.5rem;
                }
                .rubric-point {
                    flex-grow: 1;
                    line-height: 1.3;
                    font-family: 'TAU-Paalai', serif;
                }
                /* Hidden helper for editor boxes that are empty in the final key */
                .mark-indicator:empty:not(:focus) {
                    display: none;
                }
                /* Style for the mark indicator when it's being edited or has content */
                .mark-indicator {
                    font-weight: bold;
                    color: #000;
                }
            `}} />
        </div>
    );
};

export default AnswerKeyView;