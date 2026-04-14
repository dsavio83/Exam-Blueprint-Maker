import React, { useState } from 'react';
import { Blueprint, Curriculum, BlueprintItem, CognitiveProcess, ItemFormat } from '@/types';
import { Download, FileText, Printer } from 'lucide-react';
import AnswerKeyView from './AnswerKeyView';

interface ReportsViewProps {
    blueprint: Blueprint;
    curriculum: Curriculum;
    onDownloadPDF: (tab: string) => void;
    onDownloadWord: (tab: string) => void;
}

export const ReportsView = ({ blueprint, curriculum, onDownloadPDF, onDownloadWord }: ReportsViewProps) => {
    const [activeTab, setActiveTab] = useState('report1');

    // Helper to divide blueprint items into "Group Questions" (items with same group ID or naturally sequential items)
    const sortedGroups = [...blueprint.items].sort((a, b) => {
        // First sort by section (marks ascending)
        const aSecMarks = parseInt(a.sectionId?.split('-').pop() || '0');
        const bSecMarks = parseInt(b.sectionId?.split('-').pop() || '0');
        if (aSecMarks !== bSecMarks) return aSecMarks - bSecMarks;
        
        // Then by unit/subunit
        if (a.unitId !== b.unitId) return a.unitId.localeCompare(b.unitId);
        return a.subUnitId.localeCompare(b.subUnitId);
    });

    const getDisplayTime = (marks: number) => {
        if (marks <= 2) return 5;
        if (marks <= 4) return 10;
        return 15;
    };

    const termTamil = blueprint.examTerm === 'First' ? 'முதல்' : blueprint.examTerm === 'Second' ? 'இரண்டாம்' : 'மூன்றாம்';
    const termEnglish = blueprint.examTerm;
    const academicYear = blueprint.academicYear || '2025-26';
    const qpCode = blueprint.questionPaperTypeId?.split('-').shift() || 'QP';
    const setId = blueprint.setId?.split(' ').pop() || 'A';

    const renderReport1Content = (page: number = 1) => {
        if (page === 1) {
            return (
                <div className="border-[3px] border-black p-8 font-serif text-black min-h-[280mm] flex flex-col items-center">
                    <div className="text-center w-full mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="border-4 border-black w-14 h-14 flex items-center justify-center text-3xl font-bold">{setId}</div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold tamil-font mb-1">சமக்ர சிக்ஷா கேரளம்</h1>
                                <p className="text-sm font-bold tamil-font italic">கேரளா மாநிலக் கல்வி ஆராய்ச்சி மற்றும் பயிற்சி நிறுவனம்</p>
                                <div className="h-1 bg-black w-48 mx-auto mt-2"></div>
                            </div>
                            <div className="bg-black text-white rounded-full px-6 py-2 font-bold text-lg shadow-lg">GI {qpCode}</div>
                        </div>

                        <div className="space-y-4 mt-10">
                            <h2 className="text-2xl font-bold tamil-font tracking-wide">{termTamil} பருவ தொகுத்தறி மதிப்பீடு {academicYear}</h2>
                            <h3 className="text-lg font-bold uppercase tracking-widest">{termEnglish} Term Summative Assessment {academicYear}</h3>
                            <div className="relative py-4">
                                <span className="absolute left-0 right-0 top-1/2 h-[2px] bg-black/20"></span>
                                <h1 className="relative bg-white px-8 text-3xl font-black uppercase inline-block border-2 border-black py-2 tracking-tighter">
                                    General Information
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl mt-12 space-y-8">
                        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                            <div className="flex flex-col border-b-2 border-black pb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">Class / வகுப்பு</span>
                                <span className="text-xl font-bold">{blueprint.classLevel}</span>
                            </div>
                            <div className="flex flex-col border-b-2 border-black pb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">Subject / பாடம்</span>
                                <span className="text-xl font-bold tamil-font">{blueprint.subject}</span>
                            </div>
                            <div className="flex flex-col border-b-2 border-black pb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">Score / மதிப்பெண்</span>
                                <span className="text-xl font-bold">{blueprint.totalMarks}</span>
                            </div>
                            <div className="flex flex-col border-b-2 border-black pb-2">
                                <span className="text-xs font-bold uppercase text-gray-500">Time / நேரம்</span>
                                <span className="text-xl font-bold">2.30 Hrs</span>
                            </div>
                        </div>

                        <div className="mt-20 space-y-6">
                            <h3 className="text-xl font-bold border-b-2 border-black pb-2 uppercase tracking-wide">Standard of the Question Paper</h3>
                            <table className="w-full border-black">
                                <thead>
                                    <tr className="bg-gray-100 italic">
                                        <th className="border border-black p-3 text-left">Level of Difficulty</th>
                                        <th className="border border-black p-3 text-center w-32">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="font-bold">
                                    <tr>
                                        <td className="border border-black p-3">Easy (அறிவுசார் நிலை)</td>
                                        <td className="border border-black p-3 text-center">30%</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-3">Average (புரிந்து கொள்ளுதல்)</td>
                                        <td className="border border-black p-3 text-center">50%</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-3">Difficult (உயர்மட்ட சிந்தனை)</td>
                                        <td className="border border-black p-3 text-center">20%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderReport2Content = (items: BlueprintItem[], pageIdx: number) => {
        return (
            <div className="text-black">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm">{pageIdx + 1}</div>
                        Item Analysis Report
                    </h2>
                    <div className="text-right text-xs font-bold uppercase text-gray-500">
                        {blueprint.subject} | Class {blueprint.classLevel} | Page {pageIdx + 1}
                    </div>
                </div>

                <table className="w-full border-black text-[11px]">
                    <thead>
                        <tr className="bg-blue-600 text-white font-bold text-center">
                            <th className="border border-black p-2 w-10">Q.No</th>
                            <th className="border border-black p-2 w-[25%]">SLO (கற்பித்தல் நோக்கம்)</th>
                            <th className="border border-black p-2 w-12">CP (மதிப். நிலை)</th>
                            <th className="border border-black p-2 w-20">Type (வகை)</th>
                            <th className="border border-black p-2">Unit / Lesson</th>
                            <th className="border border-black p-2 w-14">Marks</th>
                            <th className="border border-black p-2 w-14">Time</th>
                            <th className="border border-black p-2 w-16">Item Fmt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => {
                            const unit = curriculum.units.find(u => u.id === item.unitId);
                            const lo = unit?.learningOutcomes || '-';
                            const cp = item.cognitiveProcess?.split(' ')[0] || 'N/A';
                            const kl = item.knowledgeLevel;
                            const time = getDisplayTime(item.marksPerQuestion);

                            return (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-black p-2 text-center font-bold">{idx + 1 + (pageIdx * 10)}</td>
                                    <td className="border border-black p-2 tamil-font leading-relaxed">{lo}</td>
                                    <td className="border border-black p-2 text-center font-bold text-blue-800">{cp}</td>
                                    <td className="border border-black p-2 text-center font-bold">{kl}</td>
                                    <td className="border border-black p-2 tamil-font font-medium">{unit?.unitNumber}: {unit?.name}</td>
                                    <td className="border border-black p-2 text-center font-bold bg-blue-50">{item.totalMarks}</td>
                                    <td className="border border-black p-2 text-center italic">{time}m</td>
                                    <td className="border border-black p-2 text-center font-bold uppercase">{item.itemFormat}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderReport3Content = () => {
        const cpKeys = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6', 'CP7'];
        const levelKeys = ['B', 'A', 'P'];
        const levelNames = ['Basic', 'Average', 'Profound'];
        const formatLabels = ['Obj', 'VSA', 'SA1', 'SA2', 'LA', 'Other'];
        const formatEnums = ['Objective', 'VSA', 'SA-1', 'SA-2', 'LA', 'Other'];

        const footerSums = {
            cp: {} as any,
            level: {} as any,
            format: {} as any,
            totalItems: 0,
            totalScore: 0,
            totalTime: 0
        };

        return (
            <div className="text-black">
                <div className="mb-6 font-sans">
                    <div className="flex justify-between items-start mb-4">
                        <div className="border-2 border-black w-10 h-10 flex items-center justify-center text-xl font-bold">{setId}</div>
                        <div className="text-center flex-1">
                            <h1 className="text-xl font-bold text-black tamil-font">சமக்ர சிக்ஷா கேரளம்</h1>
                            <p className="text-[10px] font-bold tamil-font -mt-1 text-gray-700">கேரளா மாநிலக் கல்வி ஆராய்ச்சி மற்றும் பயிற்சி நிறுவனம்</p>
                        </div>
                        <div className="bg-black text-white rounded-full px-4 py-1 font-bold text-sm">GI {qpCode}</div>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-[16px] font-bold text-black tamil-font">{termTamil} பருவ தொகுத்தறி மதிப்பீடு {academicYear}</h2>
                    <h3 className="text-sm font-bold uppercase text-black mb-3 font-sans">{termEnglish} Term Summative Assessment {academicYear}</h3>
                    
                    <h1 className="text-[18px] font-bold text-black border-b-2 border-black inline-block px-4 pb-1 uppercase">
                        Blueprint Matrix – {blueprint.classLevel}{blueprint.subject.includes('AT') ? 'AT' : 'BT'}
                    </h1>
                    <div className="flex justify-center gap-6 mt-2">
                        <h2 className="text-[14px] font-bold text-black tamil-font">
                            {blueprint.subject.includes('AT') ? 'தமிழ் முதல் தாள் (AT)' : 'தமிழ் இரண்டாம் தாள் (BT)'}
                        </h2>
                        <h2 className="text-[14px] font-bold text-black underline">{blueprint.questionPaperTypeName}</h2>
                    </div>
                </div>

                <table className="w-full border-black text-[9px]">
                    <thead>
                        <tr className="bg-[#e2efda]">
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-8">வி.எண் (S.No)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-[16%]">கற்பித்தல் நோக்கம் (SLO)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-[12%]">அலகு / பாடம் (Unit)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-[12%]">உள் அலகு (Sub Unit)</th>
                            <th colSpan={7} className="border border-black p-1 bg-orange-100 text-black font-bold text-center">அறிவுசார் செயல்பாடுகள் (CP)</th>
                            <th colSpan={3} className="border border-black p-1 bg-blue-100 text-black font-bold text-center">நிலை (Level)</th>
                            <th colSpan={6} className="border border-black p-1 bg-green-100 text-black font-bold text-center">வினா வடிவம் (Fmt)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-7">நேரம் (min)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-7">எண் (Itm)</th>
                            <th rowSpan={2} className="border border-black p-1 text-black font-bold text-center w-8">மதிப். (Scr)</th>
                        </tr>
                        <tr className="bg-[#f2f2f2] text-[8px]">
                            {cpKeys.map(k => <th key={k} className="border border-black p-1 w-6">{k}</th>)}
                            {levelKeys.map(k => <th key={k} className="border border-black p-1 w-6">{k}</th>)}
                            {formatLabels.map(l => <th key={l} className="border border-black p-1 w-7">{l}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedGroups.map((item) => {
                            const unit = curriculum.units.find(u => u.id === item.unitId);
                            const subUnit = unit?.subUnits.find(s => s.id === item.subUnitId);
                            const lo = unit?.learningOutcomes || '-';
                            const hasChoice = item.hasInternalChoice;
                            const time = getDisplayTime(item.marksPerQuestion);
                            const qLabel = (item as any).qRange || (sortedGroups.indexOf(item) + 1).toString();

                            // Metadata for Option A
                            const cpA = item.cognitiveProcess?.split(' ')[0] || '';
                            const klA = item.knowledgeLevel;
                            const klKeyA = klA && klA.length > 0 ? klA[0] : '';
                            const fmtA = item.itemFormat;

                            // Update Footer Sums (Only from Option A profile to represent the distinct item score)
                            if (!footerSums.cp[cpA]) footerSums.cp[cpA] = { count: 0, score: 0 };
                            footerSums.cp[cpA].count += item.questionCount;
                            footerSums.cp[cpA].score += item.totalMarks;

                            if (klKeyA) {
                                if (!footerSums.level[klKeyA]) footerSums.level[klKeyA] = { count: 0, score: 0 };
                                footerSums.level[klKeyA].count += item.questionCount;
                                footerSums.level[klKeyA].score += item.totalMarks;
                            }

                            if (!footerSums.format[fmtA]) footerSums.format[fmtA] = { count: 0, score: 0 };
                            footerSums.format[fmtA].count += item.questionCount;
                            footerSums.format[fmtA].score += item.totalMarks;

                            footerSums.totalItems += item.questionCount;
                            footerSums.totalScore += item.totalMarks;
                            footerSums.totalTime += time * item.questionCount;

                            return (
                                <React.Fragment key={item.id}>
                                    {/* Option A Row */}
                                    <tr className={hasChoice ? 'bg-blue-50/10' : ''}>
                                        <td className="border border-black p-1 text-center font-bold align-middle bg-gray-50" rowSpan={hasChoice ? 2 : 1}>
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span>{qLabel}</span>
                                                {hasChoice && <span className="tamil-font text-[9px] font-bold text-blue-700 bg-blue-100 px-1 rounded">(அ)</span>}
                                            </div>
                                        </td>
                                        <td className="border border-black p-1 tamil-font text-xs align-top bg-white" rowSpan={hasChoice ? 2 : 1}>{lo}</td>
                                        <td className="border border-black p-1 text-center tamil-font text-xs align-top bg-white" rowSpan={hasChoice ? 2 : 1}>Unit {unit?.unitNumber}: {unit?.name}</td>
                                        <td className="border border-black p-1 text-center tamil-font text-xs align-top bg-white" rowSpan={hasChoice ? 2 : 1}>{subUnit?.name}</td>
                                        
                                        {/* CP Columns */}
                                        {cpKeys.map(k => (
                                            <td key={k} className="border border-black p-1 text-center font-bold">
                                                {cpA === k ? `${item.questionCount}(${item.totalMarks})` : ''}
                                            </td>
                                        ))}
                                        {/* Level Columns */}
                                        {levelNames.map(l => (
                                            <td key={l} className="border border-black p-1 text-center font-bold">
                                                {klA === l ? `${item.questionCount}(${item.totalMarks})` : ''}
                                            </td>
                                        ))}
                                        {/* Format Columns */}
                                        {formatEnums.map(f => (
                                            <td key={f} className="border border-black p-1 text-center font-bold">
                                                {fmtA === f ? `${item.questionCount}(${item.totalMarks})` : ''}
                                            </td>
                                        ))}

                                        <td className="border border-black p-1 text-center font-bold" rowSpan={hasChoice ? 2 : 1}>{time * item.questionCount}</td>
                                        <td className="border border-black p-1 text-center font-bold" rowSpan={hasChoice ? 2 : 1}>{item.questionCount}</td>
                                        <td className="border border-black p-1 text-center font-bold" rowSpan={hasChoice ? 2 : 1}>{item.totalMarks}</td>
                                    </tr>

                                    {/* Option B Row */}
                                    {hasChoice && (
                                        <tr className="bg-purple-50/10">
                                            {/* CP Columns for B */}
                                            {(() => {
                                                const cpB = (item.cognitiveProcessB || item.cognitiveProcess)?.split(' ')[0] || '';
                                                return cpKeys.map(k => (
                                                    <td key={k} className="border border-black p-1 text-center font-bold">
                                                        {cpB === k ? `${item.questionCount}(${item.totalMarks})` : ''}
                                                    </td>
                                                ));
                                            })()}
                                            {/* Level Columns for B */}
                                            {(() => {
                                                const klB = item.knowledgeLevelB || item.knowledgeLevel;
                                                return levelNames.map(l => (
                                                    <td key={l} className="border border-black p-1 text-center font-bold">
                                                        {klB === l ? `${item.questionCount}(${item.totalMarks})` : ''}
                                                    </td>
                                                ));
                                            })()}
                                            {/* Format Columns for B */}
                                            {(() => {
                                                const fmtB = item.itemFormatB || item.itemFormat;
                                                return formatEnums.map(f => (
                                                    <td key={f} className="border border-black p-1 text-center font-bold">
                                                        {fmtB === f ? `${item.questionCount}(${item.totalMarks})` : ''}
                                                    </td>
                                                ));
                                            })()}
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Totals Item Row */}
                        <tr className="bg-gray-200 font-bold border-t-2 border-black">
                            <td colSpan={4} className="border border-black p-1 uppercase text-right">Total Item</td>
                            {cpKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-blue-800">
                                    {footerSums.cp[k]?.count || ''}
                                </td>
                            ))}
                            {levelKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-blue-800">
                                    {footerSums.level[k]?.count || ''}
                                </td>
                            ))}
                            {formatEnums.map(f => (
                                <td key={f} className="border border-black p-1 text-center text-blue-800">
                                    {footerSums.format[f]?.count || ''}
                                </td>
                            ))}
                            <td className="border border-black p-1 text-center">{footerSums.totalTime}</td>
                            <td className="border border-black p-1 text-center bg-black text-white">{footerSums.totalItems}</td>
                            <td className="border border-black p-1 bg-gray-300"></td>
                        </tr>

                        {/* Totals Score Row */}
                        <tr className="bg-gray-200 font-bold">
                            <td colSpan={4} className="border border-black p-1 uppercase text-right">Total Score</td>
                            {cpKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-red-800">
                                    {footerSums.cp[k]?.score || ''}
                                </td>
                            ))}
                            {levelKeys.map(k => (
                                <td key={k} className="border border-black p-1 text-center text-red-800">
                                    {footerSums.level[k]?.score || ''}
                                </td>
                            ))}
                            {formatEnums.map(f => (
                                <td key={f} className="border border-black p-1 text-center text-red-800">
                                    {footerSums.format[f]?.score || ''}
                                </td>
                            ))}
                            <td className="border border-black p-1 bg-gray-300"></td>
                            <td className="border border-black p-1 bg-gray-300"></td>
                            <td className="border border-black p-1 text-center bg-white text-black font-extrabold text-[11px]">{footerSums.totalScore}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    // Helper to chunk items for Report 2
    const chunkItems = (items: BlueprintItem[], size: number) => {
        const result = [];
        for (let i = 0; i < items.length; i += size) {
            result.push(items.slice(i, i + size));
        }
        return result;
    };
    const chunkedItems = chunkItems(sortedGroups, 10);

    return (
        <div className="mt-10 w-full text-black reports-container relative">
            {/* Sticky Sub-Header for Reports */}
            <div className="sticky top-[72px] z-30 bg-white/95 backdrop-blur-sm py-4 mb-8 no-print border-b shadow-md flex justify-center items-center gap-4 flex-wrap px-4 rounded-lg">
                <div className="flex bg-gray-200 p-1 rounded-full shadow-inner overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('report1')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report1' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Report 1
                    </button>
                    <button
                        onClick={() => setActiveTab('report2')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report2' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Report 2
                    </button>
                    <button
                        onClick={() => setActiveTab('report3')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'report3' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Report 3
                    </button>
                    <button
                        onClick={() => setActiveTab('answerKey')}
                        className={`px-4 py-2 rounded-full font-bold transition-all text-sm md:text-base whitespace-nowrap ${activeTab === 'answerKey' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
                    >
                        Answer Key
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onDownloadPDF?.(activeTab)}
                        className="bg-red-600 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all transform hover:scale-105 text-sm md:text-base outline-none"
                    >
                        <Download size={18} />
                        PDF
                    </button>
                    <button
                        onClick={() => onDownloadWord?.(activeTab)}
                        className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-blue-800 flex items-center gap-2 transition-all transform hover:scale-105 text-sm md:text-base outline-none"
                    >
                        <FileText size={18} />
                        Word
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-gray-700 text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-gray-800 flex items-center gap-2 transition-all transform hover:scale-105 text-sm md:text-base outline-none"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>

            <div className={`print-only-container ${activeTab === 'report2' || activeTab === 'report3' ? 'landscape-mode' : ''}`}>
                {/* --- UI VIEW (Only active tab) --- */}
                <div className="reports-display-content">
                    {activeTab === 'report1' && (
                        <div className="max-w-[210mm] mx-auto space-y-8 bg-white p-8 mb-8 shadow-md rounded-xl">
                            {renderReport1Content()}
                        </div>
                    )}

                    {activeTab === 'report2' && (
                        <div className="w-full space-y-8">
                            {chunkedItems.map((chunk, pageIdx) => (
                                <div key={pageIdx} className="w-full bg-white p-8 shadow-md mb-8 landscape-report-page rounded-xl">
                                    {renderReport2Content(chunk, pageIdx)}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'report3' && (
                        <div className="w-full bg-white p-8 mb-8 shadow-md rounded-xl overflow-x-auto">
                            {renderReport3Content()}
                        </div>
                    )}

                    {activeTab === 'answerKey' && (
                        <div className="max-w-[210mm] mx-auto bg-white p-8 mb-8 shadow-md rounded-xl">
                            <AnswerKeyView blueprint={blueprint} curriculum={curriculum} />
                        </div>
                    )}
                </div>

                {/* --- PDF CAPTURE SOURCE (positioned off-screen but fully visible for html2canvas) --- */}
                <div id="pdf-capture-source" className="no-print" style={{ position: 'fixed', top: 0, left: '-99999px', zIndex: -1, pointerEvents: 'none' }}>
                    <div id="report-page-1" className="bg-white p-8" style={{ width: '794px' }}>
                        {renderReport1Content(1)}
                    </div>

                    {chunkedItems.map((chunk, pageIdx) => (
                        <div key={pageIdx} id={`report-item-analysis-page-${pageIdx}`} className="bg-white p-8" style={{ width: '1920px' }}>
                            {renderReport2Content(chunk, pageIdx)}
                        </div>
                    ))}

                    <div id="report-page-blueprint-matrix" className="bg-white p-8" style={{ width: '1920px' }}>
                        {renderReport3Content()}
                    </div>

                    <div id="report-answer-key" className="bg-white" style={{ width: '794px', padding: '32px' }}>
                        <AnswerKeyView blueprint={blueprint} curriculum={curriculum} isPdf={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};
