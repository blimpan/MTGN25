"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import LogoutButton from "../components/LogoutBtn";
import useAuth from "../components/useAuth";
import { set } from "firebase/database";
import { Post } from "../lib/definitions";
import EventCard from "../components/EventCard";
import AnslagCard from "../components/AnslagCard";
import { NextRequest, NextResponse } from "next/server";
import EmojiModal from "../components/EmojiModal";

const gasqueImage = "/gasqueImg.png";
const homeGradient = "/homeGradient.jpg"


/**
 * 
 * @param prefix The prefix to search for in the text.
 * @param eventDescription The text to search in.
 * @returns {string} A string containing whatever comes after the gives prefix.
 */
function parseEventDescription(prefix:string, eventDescription:string): string {
    // Shoutout to ChatGPT for this

    if (!eventDescription) {
        return "";
    }
    const textToParse = eventDescription;

    // Define the search string
    const searchString = prefix;
    
    // Find the index of the search string
    const startIndex = textToParse.indexOf(searchString);
    
    // If the search string is not found, return an empty string
    if (startIndex === -1) {
        return "";
    }
    
    // Calculate the start index of the desired substring
    const substringStart = startIndex + searchString.length;
    
    // Find the index of the newline character after the search string
    const endIndex = textToParse.indexOf('\n', substringStart);
    
    // Extract and return the substring from the search string to the newline or the end of the string
    return endIndex === -1 ? textToParse.substring(substringStart).trim() : textToParse.substring(substringStart, endIndex).trim();
    
}


/**
 * 
 * @param dateTime A string such as "2024-08-18T10:15:00+02:00"
 * @returns {string} A string such as "10:15 Söndag"
 */
function formatDateTime(startTime: string, endTime: string): string {

    const dateObjects = [new Date(startTime), new Date(endTime)];

    const weekdayMap: { [key: number]: string } = {
        1: "Måndag",
        2: "Tisdag",
        3: "Onsdag",
        4: "Torsdag",
        5: "Fredag",
        6: "Lördag",
        0: "Söndag",  
    };

    let finalString = "";

    // This is a little ugly I know, but using a loop won't make is easier
    let hours = dateObjects[0].getHours().toString().padStart(2, '0');
    let minutes = dateObjects[0].getMinutes().toString().padStart(2, '0');
    const weekday = weekdayMap[dateObjects[0].getDay()];

    finalString += `${hours}:${minutes}-`

    hours = dateObjects[1].getHours().toString().padStart(2, '0');
    minutes = dateObjects[1].getMinutes().toString().padStart(2, '0');

    finalString += `${hours}:${minutes} ${weekday}`;

    return finalString;
}


export default function Home() {
    // check if user is logged in
    const { user } = useAuth();

    const [posts, setPosts] = useState<Post[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    

    useEffect(() => {
        
        const fetchPostsData = async () => {
            // if user is not logged in, redirect to login page
            if (!user){ return <h1>Please login</h1>;} 
            const token = await user.getIdToken();
            const response = await fetch('/api/getPosts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const sortedPosts = data.posts.sort((a: Post, b: Post) => { // Sort posts by when they were created. Newest first.
                    const createdAt_A = new Date(a.createdAt);
                    const createdAt_B = new Date(b.createdAt);
                    return createdAt_B.getTime() - createdAt_A.getTime();
                });
                setPosts(sortedPosts);
            }
            
        };
        fetchPostsData();

        const fetchNextEvents = async () => {
           
            const response = await fetch('/api/getCalendarEvents', {
                method: 'GET',
            });
            if (response.ok) {
                const data = await response.json();
                setEvents(data.items);
            }
        };
        fetchNextEvents();

    }, [user]);

    useEffect(() => {
        //console.log("Posts");
        //console.log(posts);

    }, [posts]);

    useEffect(() => {
        //console.log("Events");
        //console.log(events);

    }, [events]);

    const [showModal, setShowModal] = useState(false);
    
    function toggleModal() { // Is passed to EventCard as a prop
        console.log("Toggling modal");
        setShowModal(!showModal);   
        console.log(showModal);
    }

    return (
        <main className="flex min-h-screen min-w-80 flex-col items-center bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0]">
            <script src="https://apis.google.com/js/api.js" type="text/javascript"></script>
            <div className="flex w-11/12 flex-col mt-5 md:mt-9 max-w-2xl"> {/* EVENT MODULE */}
                <div className="flex flex-row">
                    <p className="font-semibold text-lg text-white drop-shadow-xl sm:text-2xl ml-1">Nästa event</p>
                    <p className="text-2xl drop-shadow-md sm:text-3xl ml-1">🥳</p>
                </div>
                <div className="flex flex-col space-y-5">
                    {events.map((event) => {
                        return (
                            <EventCard key={event.id}
                                title={event.summary}
                                time={formatDateTime(event.start.dateTime, event.end.dateTime)}
                                location={event.location}
                                costs={parseEventDescription("Kostar:", event.description)}
                                description={parseEventDescription("Beskrivning:", event.description)}
                                image={event.pictureUrl}
                                onModalClick={toggleModal}
                                />
                        );
                    })}
                </div>
            </div>
            <div className="flex w-11/12 flex-col mt-5 md:mt-9 max-w-2xl mb-5"> {/* EVENT MODULE */}
            <div className="flex flex-row">
                    <p className="font-semibold text-lg text-white drop-shadow-xl sm:text-2xl pl-1">Senaste anslag</p>
                    <p className="text-2xl drop-shadow-md sm:text-3xl ml-1">📣</p>
                </div>
                
                <div className="flex flex-col space-y-5">
                    {posts.slice(0, 3).map((post) => { // Render only the first x elements in 'posts'
                        return (
                            <AnslagCard key={post.id}
                                title={post.title}
                                description={post.description}
                                createdAt={post.createdAt}/>
                        );
                    })}
                </div>
            </div>
            {showModal && <EmojiModal onCloseClick={toggleModal} />}
        </main>
    );
}
