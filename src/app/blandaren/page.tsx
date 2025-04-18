"use client"; 
import React, { useEffect, useState } from "react";
import useAuth from "../components/useAuth";

const Bandaren = () => {
  const [src, setSrc] = useState("");
  const { user } = useAuth();
  const [blandare, setBlandare] = useState([]);

  useEffect(() => {
      const fetchBlandare = async () => {
          if (!user){ return <h1>Please login</h1>;} // If middleware.ts is working this should never be rendered
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
                  setBlandare(data[0].links);
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

  return (
    <main className="flex min-h-screen min-w-80 flex-col items-center bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0]">
      <div className="flex flex-wrap justify-center">
        {blandare.map((item, index) => (
          <button
            key={index}
            className="btn bg-green-600 active:bg-green-700 focus:ring-white text-white font-semibold py-3 px-4 box-border hover:border-transparent rounded focus:ring m-1"
            onClick={() => setSrc(blandare[index])}
          >
            Bländaren {index + 1}
          </button>
        ))}
      </div>
      <iframe src={src} width="100%" height="700px" allow="autoplay"></iframe>
    </main>
  );
};

export default Bandaren;
