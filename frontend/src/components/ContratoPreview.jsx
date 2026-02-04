import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';

const ContratoPreview = ({
    htmlContent,
    assinaturaAluno,
    assinaturaResponsavel,
    dataAssinatura,
    showDownload = true,
    showPrint = true,
    className = ''
}) => {
    const previewRef = useRef(null);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');

        const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .assinatura-container { margin-top: 40px; page-break-inside: avoid; }
            .assinatura-box { display: inline-block; text-align: center; margin-right: 50px; }
            .assinatura-img { max-width: 200px; max-height: 80px; border-bottom: 1px solid #000; }
            .assinatura-label { font-size: 12px; margin-top: 5px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          ${(assinaturaAluno || assinaturaResponsavel) ? `
            <div class="assinatura-container">
              ${assinaturaAluno ? `
                <div class="assinatura-box">
                  <img src="${assinaturaAluno}" class="assinatura-img" />
                  <p class="assinatura-label">Assinatura do Aluno</p>
                  ${dataAssinatura ? `<p class="assinatura-label">${new Date(dataAssinatura).toLocaleString('pt-BR')}</p>` : ''}
                </div>
              ` : ''}
              ${assinaturaResponsavel ? `
                <div class="assinatura-box">
                  <img src="${assinaturaResponsavel}" class="assinatura-img" />
                  <p class="assinatura-label">Assinatura do Responsável</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </body>
      </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    const handleDownloadPDF = async () => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = previewRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save('contrato.pdf');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Toolbar */}
            {(showDownload || showPrint) && (
                <div className="flex justify-end gap-2 print:hidden">
                    {showPrint && (
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                        </Button>
                    )}
                    {showDownload && (
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                        </Button>
                    )}
                </div>
            )}

            {/* Preview Container */}
            <div
                ref={previewRef}
                className="bg-white border rounded-lg shadow-sm p-8 max-w-4xl mx-auto"
                style={{ minHeight: '600px' }}
            >
                {/* Contract Content */}
                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                {/* Signatures */}
                {(assinaturaAluno || assinaturaResponsavel) && (
                    <div className="mt-12 pt-8 border-t">
                        <h4 className="text-lg font-semibold mb-6">Assinaturas</h4>
                        <div className="flex flex-wrap gap-8">
                            {assinaturaAluno && (
                                <div className="text-center">
                                    <img
                                        src={assinaturaAluno}
                                        alt="Assinatura do Aluno"
                                        className="max-w-[250px] h-auto border-b-2 border-gray-800 pb-2"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">Assinatura do Aluno</p>
                                    {dataAssinatura && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(dataAssinatura).toLocaleString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                            )}
                            {assinaturaResponsavel && (
                                <div className="text-center">
                                    <img
                                        src={assinaturaResponsavel}
                                        alt="Assinatura do Responsável"
                                        className="max-w-[250px] h-auto border-b-2 border-gray-800 pb-2"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">Assinatura do Responsável</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContratoPreview;
