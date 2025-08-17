"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useAuth from "../components/useAuth";
import MobilePDFViewer from "../components/MobilePDFViewer";
import Flipbook from "../components/Flipbook";

const Bandaren = () => {
  const [src, setSrc] = useState<string[]>([]);
  const { user } = useAuth();
  const [blandare, setBlandare] = useState<string[][]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchBlandare = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      try {
        const response = await fetch('/api/getBlandare', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Expecting data to be an array of arrays of image URLs
          setBlandare(data);
        } else {
          console.error('Failed to fetch blandare');
        }
      } catch (error) {
        console.error('Error fetching blandare:', error);
      }
    };
    fetchBlandare();
  }, [user]);

  if (!user) return <h1>Please login</h1>;

  if (blandare.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-stars flex items-center justify-center">
        <h1 className="text-white text-2xl">Ingen Bländare har publicerats än. Kom tillbaka senare eller något</h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen min-w-80 flex-col items-center bg-gradient-stars">
      <div className="flex flex-wrap justify-center mb-10 mt-4">
        {blandare.map((images, index) => (
          <button
            key={index}
            className="shadow-pink-glow btn bg-[#F288C6] active:bg-[#591d72] focus:ring-white text-white font-semibold py-3 px-4 box-border hover:border-transparent rounded focus:ring m-1"
            onClick={() => setSrc(images)}
          >
            Bländaren {index + 1}
          </button>
        ))}
      </div>
      {src.length > 0 && (
        isMobile
          ? <MobilePDFViewer images={src} />
          : <Flipbook images={src} />
      )}
    </main>
  );
};

export default Bandaren;
