import React from 'react';
import { FileText } from 'lucide-react';
import { Blueprint, Curriculum, Unit } from '../types';

interface AnswerKeyViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum | null;
}

const AnswerKeyView = ({ blueprint, curriculum }: AnswerKeyViewProps) => {
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
    const getQPCode = () => {
        const cls = blueprint.classLevel === 8 ? '8' : blueprint.classLevel === 9 ? '9' : '10';
        const sub = blueprint.subject.includes('AT') ? '02' : '12';
        return `T${cls}${sub} `;
    };

    const getSubjectTitle = () => {
        if (blueprint.subject.includes('AT')) {
            return { tamil: 'தமிழ் முதல் தாள் (AT)', eng: 'First Language - Tamil Paper I' };
        }
        return { tamil: 'தமிழ் இரண்டாம் தாள் (BT)', eng: 'First Language - Tamil Paper II' };
    };

    const getTermTamil = () => {
        switch (blueprint.examTerm) {
            case 'First Term Exam': return 'முதல்';
            case 'Second Term Exam': return 'இரண்டாம்';
            case 'Third Term Exam': return 'மூன்றாம்';
            default: return 'முதல்';
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
    const qpCode = getQPCode();
    const subjectTitle = getSubjectTitle();
    const termTamil = getTermTamil();
    const setId = (blueprint.setId || 'Set A').replace('Set ', '');
    const termEnglish = blueprint.examTerm === 'First Term Exam' ? 'First' : blueprint.examTerm === 'Second Term Exam' ? 'Second' : 'Third';

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 paper-container max-w-4xl mx-auto">
            {/* Answer Key Header - Synced with Report 1 */}
            <div className="mb-6 font-sans">
                <div className="flex justify-between items-start mb-4">
                    <div className="border-2 border-black w-10 h-10 flex items-center justify-center text-xl font-bold">{setId}</div>
                    <div className="text-center flex-1">
                        <h1 className="text-xl font-bold text-black tamil-font">சமக்ர சிக்ஷா கேரளம்</h1>
                    </div>
                    <div className="bg-black text-white rounded-full px-4 py-1 font-bold text-sm">GI {qpCode}</div>
                </div>
                <div className="text-center mb-2">
                    <h2 className="text-lg font-bold text-black tamil-font">{termTamil} பருவ மதிப்பீடு {academicYear}</h2>
                    <h3 className="text-md font-bold uppercase text-black">{termEnglish} Term Evaluation {academicYear}</h3>
                </div>
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-black tamil-font">{subjectTitle.tamil}</h2>
                    <h3 className="text-md font-bold text-black">{subjectTitle.eng}</h3>
                </div>
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mt-4 font-bold text-lg text-black">
                    <div className="w-1/3">Std. : {blueprint.classLevel}</div>
                    <div className="text-right w-2/3">
                        <div className="mb-1 tamil-font">நேரம் : 1½ மணி</div>
                        <div className="tamil-font">மதிப்பெண் : {blueprint.totalMarks}</div>
                    </div>
                </div>

                <div className="mt-6 text-center text-pink-600 font-bold text-xl italic underline tamil-font">
                    Proforma for Scoring Key & Marking Scheme
                </div>
            </div>

            {/* Answer Key Table */}
            <div className="overflow-hidden border border-black rounded-sm">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-green-100/50 text-black">
                            <th className="border border-black p-2 text-sm font-bold w-16 text-center">Item/<br />Qn. No.</th>
                            <th className="border border-black p-2 text-sm font-bold w-12 text-center">Score</th>
                            <th className="border border-black p-2 text-sm font-bold text-center">Answer/Value Points</th>
                            <th className="border border-black p-2 text-sm font-bold w-32 text-center">Further Information</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedItems.map((item, index) => (
                            <tr key={item.id} className="min-h-[60px] text-black">
                                <td className="border border-black p-3 text-center font-bold">{index + 1}</td>
                                <td className="border border-black p-3 text-center font-bold">{item.marksPerQuestion}</td>
                                <td className="border border-black p-3 text-left">
                                    <div className="space-y-4">
                                        {/* Option A */}
                                        {item.hasInternalChoice && (
                                            <div className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-tighter">Option A</div>
                                        )}
                                        <div className="tamil-font leading-relaxed">
                                            {item.answerText ? (
                                                <div dangerouslySetInnerHTML={{ __html: item.answerText }} />
                                            ) : (
                                                <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                            )}
                                        </div>

                                        {/* Option B if internal choice exists */}
                                        {item.hasInternalChoice && (
                                            <div className="mt-4 pt-4 border-t border-dashed border-gray-400">
                                                <div className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-tighter">Option B</div>
                                                <div className="tamil-font leading-relaxed">
                                                    {item.answerTextB ? (
                                                        <div dangerouslySetInnerHTML={{ __html: item.answerTextB }} />
                                                    ) : (
                                                        <span className="text-gray-400 italic font-normal text-xs">(Option B விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="border border-black p-3">
                                    {/* Placeholder for further information */}
                                </td>
                            </tr>
                        ))}
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
                    }
                    .tamil-font {
                        font-family: inherit;
                    }
                }
                .tamil-font {
                    line-height: 1.8;
                }
            `}} />
        </div>
    );
};

export default AnswerKeyView;
