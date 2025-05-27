"use client"

import Image from "next/image";


function getTimeSincePost(createdAt:Date) {

    if (!createdAt) {
        return "";
    }
    
    const postTime = new Date(createdAt); // Idk why but createdAt needs to be re-cast as a Date object for this to work
    const currentTime = new Date();
    const diff = currentTime.getTime() - postTime.getTime(); 

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeSince = '';

    if (days > 0) {
        timeSince = `${days} dag${days > 1 ? 'ar' : ''} sedan`;
    } else if (hours > 0) {
        timeSince = `${hours} tim${hours > 1 ? 'mar' : 'me'} sedan`;
    } else if (minutes > 0) {
        timeSince = `${minutes} minut${minutes > 1 ? 'er' : ''} sedan`;
    } else {
        timeSince = `${seconds} sekund${seconds > 1 ? 'er' : ''} sedan`;
    }
    
    return timeSince;
}


export default function AnslagCard(params:any) {
    return (
        <div className="flex w-full flex-col bg-almost-black text-amber-50 border-light-yellow border drop-shadow-homeShadow rounded-lg p-1 animate-fadeIn">
            <div className="flex w-full place-content-between">
                <p className="w-4/5 p-1 -mt-0.5 sm:p-2 font-semibold break-words sm:text-lg">{params.title || "Blog post title"}</p>
                <p className="text-xs text-right p-0.5 mt-1 sm:p-2 min-w-fit text-stone-100 sm:text-sm">{getTimeSincePost(params.createdAt) || "69 f.Kr"}</p>
            </div>
            <div className="flex w-full">
            </div>
                <p className="text-sm break-words p-1 sm:p-2 -mt-1 sm:text-base">{params.description || "Bla bla bla..."}</p>
        </div>
    );
};
