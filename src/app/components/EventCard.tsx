"use client"

import Image from "next/image";
import EmojiModal from "./EmojiModal";
import { useState } from "react";

const lokeImage = "/Loke_i_Dubrovnik.png";
const clockIcon = "/clock-60.png";
const locationIcon = "/place-60.png";
const moneyIcon = "/money-48.png";
const informationIcon = "/information-48.png";
const backupImage = "/backup.webp";


export default function EventCard(params:any) {
    
    function handleQuestionMark() {
        params.onModalClick();
    }

    return (
        <div className="flex min-w-[300px] min-h-[70px] w-full flex-row h-36 sm:h-48 bg-white drop-shadow-homeShadow rounded-lg animate-fadeIn">
            <div className="flex w-1/3 sm:w-2/5 relative mr-1">
                <Image alt="Preview image of event" src={params.image || backupImage} fill={true} objectFit="cover" className="rounded-l-md"></Image>
            </div>
            <div className="flex w-2/3 sm:w-3/5 flex-col place-content-between p-2 sm:p-3">
                <p className="font-semibold sm:text-xl whitespace-nowrap overflow-hidden text-ellipsis">{params.title || "Event title"}</p>
                
                <div className="flex flex-row items-center">
                    <div className="mr-1 w-6 sm:w-7">
                        <Image src={clockIcon} width={36} height={36} alt="" className="object-cover"/>
                    </div>
                    <p className="sm:text-lg">{params.time || "?"}</p>
                </div>
                
                <div className="flex flex-row items-center">
                    <div className="mr-1 w-6 sm:w-7">
                        <Image src={locationIcon} width={36} height={36} alt="" className="object-cover"/>
                    </div>
                    <p className="sm:text-lg">{params.location || "?"}</p>
                </div>

                <div className="flex flex-row items-center">
                    <div className="mr-1 w-6 sm:w-7">
                        <Image src={moneyIcon} width={36} height={36} alt="" className="object-cover"/>
                    </div>
                    <p className="sm:text-lg">{params.costs || "Nej"}</p>
                </div>

                <div className="flex flex-row items-center">
                    <div className="mr-1 w-6 sm:w-7">
                        <Image src={informationIcon} width={36} height={36} alt="" className="object-cover"/>
                    </div>
                    <p className="text-xl sm:text-2xl">{params.description || ""}</p>

                    <div className="flex flex-row-reverse grow">
                        <button className="border rounded-full text-sm size-7  hover:bg-gray-400 transition ease-in-out" onClick={handleQuestionMark}>?</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
