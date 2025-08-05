import LinearProgress from '@mui/material/LinearProgress';
import React, { useEffect, useState } from 'react';
import { Document, Page as ReactPdfPage, pdfjs } from 'react-pdf';

const Page = React.forwardRef<HTMLDivElement, { pageNumber: number; width: number }>(
    ({ pageNumber, width }, ref) => (
        <div ref={ref}>
            <ReactPdfPage pageNumber={pageNumber} width={width} />
        </div>
    )
);

function MobilePDFViewer({ src }: { src: string }) {
    const [numPages, setNumPages] = useState<number>(0);
    const [width, setWidth] = useState<number>(window.innerWidth - 32);

    // Mandatory in order to render the PDF correctly
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();

    // Handles the resizing of the window, changes the size of the PDF pages accordingly
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth - 32);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ overflowY: 'auto', maxHeight: '80vh' }}>
            <Document
                file={src}
                loading={<LinearProgress />}
                noData={<LinearProgress />}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            > {/* This is what actually handles the render of the pdf */}
                {Array.from({ length: numPages }, (_, i) => (
                    <Page key={i + 1} pageNumber={i + 1} width={width} /> // Each page of the pdf specified in src 
                ))}
            </Document>
        </div >
    );
}

export default MobilePDFViewer;