"use client"; 
import React, { useEffect, useState } from "react";
import useAuth from "../components/useAuth";

const Video = () => {
  const [src, setSrc] = useState("");
  const { user } = useAuth();
  const [video, setVideo] = useState([]);

  useEffect(() => {
      const fetchVideo = async () => {
          if (!user){ return <h1>Please login</h1>;} // If middleware.ts is working this should never be rendered
          const token = await user.getIdToken();
          try {
              const response = await fetch('/api/getVideo', {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${token}`
                  }
              });
              if (response.ok) {
                  const data = await response.json();
                  console.log(data[0].link);
                  setVideo(data[0].link);
              } else {
                  console.error('Failed to fetch video');
              }
          } catch (error) {
              console.error('Error fetching video:', error);
          }
        };
    fetchVideo();
  }, [user]);

  if (!user) return <h1>Please login</h1>;

  return (
    <main className="flex min-h-screen min-w-80 flex-col items-center bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0]">
      <div className="flex flex-wrap justify-center m-4">
        {video.map((item, index) => (
          <button
            key={index}
            className="btn bg-green-600 active:bg-green-700 focus:ring-white text-white font-semibold py-3 px-4 box-border hover:border-transparent rounded focus:ring m-1"
            onClick={() => setSrc(video[index])}
          >
            Filmprojektet {index + 1}
          </button>
        ))}
      </div>
      <div className="relative w-4/5 pb-[35%] h-0">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={src}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>    
    </main>
  );
};

export default Video;
