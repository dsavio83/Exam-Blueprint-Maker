
import Swal from 'sweetalert2';
import { DocExportService } from '../services/docExport';
import { exportPDF } from '../services/db';
import { Blueprint, Curriculum, Discourse } from '../types';
export const useExport = () => {
    const handleDownloadPDF = async (currentBlueprint: Blueprint | null, curriculum: Curriculum | null, type: string = 'all', isAdmin: boolean = false) => {
        if (!currentBlueprint || !curriculum) return;
        
        Swal.fire({
            title: 'Generating PDF...',
            text: 'Please wait while we prepare your document',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const baseUrl = window.location.origin;
            const mode = isAdmin ? 'admin' : 'user';
            
            const pdfBlob = await exportPDF(currentBlueprint.id, baseUrl, type, mode);
            
            const url = window.URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            
            // Note: We don't immediately revoke the URL so the new tab has time to load it.
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 60000);

            Swal.close();
        } catch (error) {
            console.error("PDF generation failed:", error);
            Swal.fire("Error", "Failed to generate PDF document. Make sure the backend server is running.", "error");
        }
    };

    const handleDownloadWord = async (currentBlueprint: Blueprint | null, curriculum: Curriculum | null, discourses: Discourse[], type: string = 'all') => {
        if (!currentBlueprint || !curriculum) return;
        try {
            if (type === 'report1' || type === 'all') await DocExportService.exportReport1(currentBlueprint, curriculum);
            if (type === 'report2' || type === 'all') await DocExportService.exportReport2(currentBlueprint, curriculum);
            if (type === 'report3' || type === 'all') await DocExportService.exportReport3(currentBlueprint, curriculum);
            if (type === 'answerKey' || type === 'all') await DocExportService.exportAnswerKey(currentBlueprint, curriculum, discourses);
        } catch (error) {
            console.error("Word export failed:", error);
            Swal.fire("Error", "Failed to export Word document.", "error");
        }
    };

    return {
        handleDownloadPDF,
        handleDownloadWord
    };
};
