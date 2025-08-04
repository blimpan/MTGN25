import LinearProgress from '@mui/material/LinearProgress';
import { useCallback, useEffect, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import useResizeObserver from 'use-resize-observer';

function Flipbook({ src }: { src: string }) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number>(1.414); // default A5 aspect ratio (height/width)

    // Responsive width
    const { ref, width = 2000 } = useResizeObserver<HTMLDivElement>();
    const pageWidth = width;
    const pageHeight = pageWidth * aspectRatio;
    const [transform, setTransform] = useState<any>(0); // Initial transform to center the flipbook

    // Set the worker source for PDF.js using CDN for Next.js/Vercel compatibility
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setTransform(-pageWidth / 4); // Center the flipbook initially
    }

    // Only update aspect ratio, not width/height
    function onPageLoadSuccess(page: any) {
        if (page.originalWidth && page.originalHeight) {
            setAspectRatio(page.originalHeight / page.originalWidth);
        }
    }

    // This function is called when the page animation ends, to determine if the current page is the first or last
    // and adjust the transform accordingly
    const checkCurrentPage = (e: any) => {
        if (numPages == null) {
            setTransform(0);
            return;
        }
        if (e.data === 0) {
            setTransform(-pageWidth / 4);
        } else if (e.data === numPages - 1) {
            setTransform(pageWidth / 4);
        } else {
            setTransform(0);
        }
    }

    return (
        // This div determines the size of the flipbook, whereas "max-w-7xl" is the acual width of the whole flipbook
        // so a single page is supposedly half of the size determined by this div
        // see tailwind max width for other sizes if desired
        <div ref={ref} className="w-full max-w-7xl mx-auto mb-8" style={{ transform: "translateX(" + transform + "px)", transition: "transform .5s" }} >
            <Document
                file={src}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<LinearProgress />}
                noData={<LinearProgress />}
            > {/*The actual rendering of the pdf happens here, with a load animation for big files  */}
                {numPages && (

                    <HTMLFlipBook
                        width={pageWidth}
                        height={pageHeight}
                        maxShadowOpacity={0.5}
                        drawShadow={true}
                        showCover={true}
                        size="stretch"
                        style={{ width: "100%", height: "auto" }}
                        onFlip={checkCurrentPage}
                    > {/* The actual flipbook component, which handles the flip animation and the pages */}
                        {Array.from(new Array(numPages), (el, index) => (

                            <div
                                className="demoPage"
                                key={`page_${index + 1}`}
                                style={{
                                    width: pageWidth,
                                    height: pageHeight,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >  {/* This div className "demoPage" is used within the flipbook animation library and is used to display the flip properly*/}
                                <Page pageNumber={index + 1} width={pageWidth / 2} />
                            </div>
                        ))}
                    </HTMLFlipBook>
                )}
            </Document>
        </div >
    );
}

export default Flipbook;