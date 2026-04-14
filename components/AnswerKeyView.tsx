import React from 'react';
import { FileText } from 'lucide-react';
import { Blueprint, Curriculum, Unit } from '../types';

interface AnswerKeyViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum | null;
    isPdf?: boolean;
}

const AnswerKeyView = ({ blueprint, curriculum, isPdf = false }: AnswerKeyViewProps) => {
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
            '10-AT': 'T1001',
            '10-BT': 'T1012',
            '9-AT': 'T901',
            '9-BT': 'T912',
            '8-AT': 'T801',
            '8-BT': 'T812'
        };
        return codeMap[`${blueprint.classLevel}-${subject}`] || `T${blueprint.classLevel}${subject === 'AT' ? '01' : '12'}`;
    };

    const getSubjectTitle = () => {
        if (blueprint.subject.includes('AT')) {
            return { tamil: 'தமிழ் முதல் தாள்', eng: 'Tamil Language Paper I (AT)' };
        }
        return { tamil: 'தமிழ் இரண்டாம் தாள்', eng: 'Tamil Language Paper II (BT)' };
    };

    const getTermHeading = () => {
        const year = academicYear.replace(/^(\d{4})-(\d{2})$/, '$1-$2');
        switch (blueprint.examTerm) {
            case 'First Term Exam': return `முதல்பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
            case 'Second Term Exam': return `இரண்டாம் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
            case 'Third Term Exam': return `இறுதிப் பருவத் தொகுத்தறி மதிப்பீடு ${year}`;
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

    return (
        <div className={isPdf ? 'bg-white' : 'bg-white p-8 rounded-xl shadow-lg border border-gray-200 paper-container max-w-4xl mx-auto'}>
            <div className="mb-6 font-sans">
                <div className="border-y-2 border-black py-4 space-y-2">
                    <div className="text-center">
                        <div className="text-lg font-bold text-black">{paperCode}</div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-black tamil-font">சமக்ர சிக்ஷா கேரளம்</h1>
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-black tamil-font">{termHeading}</h2>
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-black tamil-font">{subjectTitle.tamil}</h2>
                        <h3 className="text-md font-bold text-black">{subjectTitle.eng}</h3>
                    </div>
                    <div className="flex justify-between text-black font-bold pt-2">
                        <div>
                            <div className="tamil-font">நேரம்: 90 நிமிடம்</div>
                            <div className="tamil-font">சிந்தனை நேரம் : 15 நிமிடம்</div>
                        </div>
                        <div className="text-right">
                            <div className="tamil-font">வகுப்பு: {blueprint.classLevel}</div>
                            <div className="tamil-font">மதிப்பெண்: {blueprint.totalMarks}</div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <h3 className="text-xl font-bold text-pink-600 underline italic tamil-font">
                        Proforma for Scoring Key & Marking Scheme
                    </h3>
                </div>
            </div>

            {/* Answer Key Table */}
            <div className="overflow-hidden">
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
                        {sortedItems.map((item, index) => {
                            if (!item.hasInternalChoice) {
                                // Normal single row
                                return (
                                    <tr key={item.id} className="min-h-[60px] text-black">
                                        <td className="border border-black p-3 text-center font-bold">{index + 1}</td>
                                        <td className="border border-black p-3 text-center font-bold">{item.marksPerQuestion}</td>
                                        <td className="border border-black p-3 text-left">
                                            <div className="tamil-font leading-relaxed">
                                                {item.answerText ? (
                                                    <div dangerouslySetInnerHTML={{ __html: item.answerText }} />
                                                ) : (
                                                    <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-3"></td>
                                    </tr>
                                );
                            }

                            // Internal choice: two separate rows — அ and ஆ
                            return (
                                <React.Fragment key={item.id}>
                                    {/* Row அ */}
                                    <tr className="min-h-[60px] text-black">
                                        <td className="border border-black p-3 text-center font-bold text-blue-700">
                                            {index + 1}<span className="tamil-font font-bold ml-1 text-[14px]">(அ)</span>
                                        </td>
                                        <td className="border border-black p-3 text-center font-bold">{item.marksPerQuestion}</td>
                                        <td className="border border-black p-3 text-left">
                                            <div className="tamil-font leading-relaxed">
                                                {item.answerText ? (
                                                    <div dangerouslySetInnerHTML={{ __html: item.answerText }} />
                                                ) : (
                                                    <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-3"></td>
                                    </tr>
                                    {/* Row ஆ */}
                                    <tr className="min-h-[60px] text-black bg-purple-50/20">
                                        <td className="border border-black p-3 text-center font-bold text-purple-700">
                                            {index + 1}<span className="tamil-font font-bold ml-1 text-[14px]">(ஆ)</span>
                                        </td>
                                        <td className="border border-black p-3 text-center font-bold">{item.marksPerQuestion}</td>
                                        <td className="border border-black p-3 text-left">
                                            <div className="tamil-font leading-relaxed">
                                                {item.answerTextB ? (
                                                    <div dangerouslySetInnerHTML={{ __html: item.answerTextB }} />
                                                ) : (
                                                    <span className="text-gray-400 italic font-normal text-xs">(விடை இன்னும் சேர்க்கப்படவில்லை)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-black p-3"></td>
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
                    }
                }
                .tamil-font {
                    line-height: 1.8;
                    font-family: 'TAU-Pallai', 'TAU-Palaai', 'Noto Serif', serif;
                }
            `}} />
        </div>
    );
};

export default AnswerKeyView;
