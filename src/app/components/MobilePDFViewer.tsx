import LinearProgress from '@mui/material/LinearProgress';
import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

function MobilePDFViewer({ images }: { images: string[] }) {
    const [numPages, setNumPages] = useState<number>(0);
    const [width, setWidth] = useState<number>(window.innerWidth - 32);
    const [allLoaded, setAllLoaded] = useState(false);
    // Mandatory in order to render the PDF correctly
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

    // Handles the resizing of the window, changes the size of the PDF pages accordingly
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth - 32);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

        useEffect(() => {
            let loaded = 0;
            if (images.length === 0) {
                setAllLoaded(true);
                return;
            }
            setAllLoaded(false);
            images.forEach((src) => {
                const img = new window.Image();
                img.onload = () => {
                    loaded += 1;
                    if (loaded === images.length) setAllLoaded(true);
                };
                img.onerror = () => {
                    loaded += 1;
                    if (loaded === images.length) setAllLoaded(true);
                };
                img.src = src;
            });
        }, [images]);

    return (
        <div style={{ overflowY: 'auto', maxHeight: '80vh' }}>
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="demoPage"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={imgUrl}
                alt={`Page ${idx + 1}`}
                style={{ width: '80%', height: '100%', objectFit: 'contain', marginTop: '2rem' }}
                
              />
            </div>
          ))}
        </div >
    );
}

export default MobilePDFViewer;