import React, { useState, useEffect } from 'react';
import useResizeObserver from 'use-resize-observer';
import dynamic from 'next/dynamic';

const HTMLFlipBook = dynamic(
  async () => (await import('react-pageflip')).default,
  { ssr: false }
) as any;

export default function Flipbook({ images, aspectRatio = 1.414 }: { images: string[]; aspectRatio?: number }) {
      const [numPages, setNumPages] = useState<number | null>(null);
    const { ref, width = 800 } = useResizeObserver<HTMLDivElement>();
  const pageWidth = width;
  const pageHeight = pageWidth * aspectRatio;
    const [transform, setTransform] = useState<any>(0); // Initial transform to center the flipbook
    const [allLoaded, setAllLoaded] = useState(false);

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

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setTransform(-pageWidth / 4); // Center the flipbook initially
    }
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
    <div
      ref={ref}
      className="w-full md:max-w-3xl xxl:max-w-7xl mx-auto mb-8"
    >
      {allLoaded && images.length > 0 && pageWidth > 0 && pageHeight > 0 && (
        <HTMLFlipBook
          width={pageWidth}
          height={pageHeight}
          size="stretch"
          maxShadowOpacity={0.5}
          drawShadow={false}
          showCover={true}
          onFlip={checkCurrentPage}
          animationDuration={1200} 
        >
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="demoPage"
              style={{
                width: pageWidth,
                height: pageHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={imgUrl}
                alt={`Page ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                loading="eager"
              />
            </div>
          ))}
        </HTMLFlipBook>
      )}
      {!allLoaded && <div className="text-center py-10">Loading pages...</div>}
    </div>
  );
}

