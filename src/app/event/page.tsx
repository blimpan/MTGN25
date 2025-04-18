'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import useAuth from '../components/useAuth';
import Modal from '../components/Modal';
import Link from 'next/link';
import Image from 'next/image';
import { set } from 'firebase/database';

interface EventData {
    event: string;
    imageUrls: string[];
}
/* GALLERY VIEW FOR DISPLAYING PICTURES FROM EACH EVENT */
export default function Event() {
    const { user } = useAuth();
    const [events, setEvents] = useState<EventData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string>('');
    const [modalImageUrls, setModalImageUrls] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(1); // Track the current image index


    const auth = getAuth();

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) {
                return;
            }
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/getEvents', {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                //console.log('Data:', data.events);
                setEvents(data.events);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };
        fetchEvents();
    }, [user]);

    const openModal = (imageUrl: string, imageUrls: string[], index: number) => {
        setModalImageUrl(imageUrl);
        setModalImageUrls(imageUrls.slice(0, 4)); // only display the first 3 images
        setCurrentIndex(index); // Set the index of the clicked image
        setIsModalOpen(true);
    };


    const closeModal = () => {
        setIsModalOpen(false);
        setModalImageUrl('');
        setModalImageUrls([]);
    };

    if (!user) {
        return <h1>Please login</h1>; // If middleware.ts is working this should never be rendered
    }

    return (
        <main className="min-h-screen bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0]">
            <div className='flex flex-col items-center mx-7 sm:mx-16 md:mx-32 lg:mx-64 xl:mx-96'>
                {events.map(event => (
                    <div className='w-full mb-8' key={event.event}>
                        <Link href={`/event/${event.event}`}>
                            <h2 className='relative flex items-center justify-center bg-white text-black font-medium text-center text-xl mt-4 rounded-lg py-4 whitespace-nowrap drop-shadow hover:bg-slate-200 w-full transition ease-in-out' style={{ cursor: 'pointer' }}>
                                <span className='absolute left-4 flex items-center'>
                                    {/* If you want to add something to the left, place it here */} 
                                </span>
                                <span className='mx-auto'>{event.event}</span>
                                <span className='absolute right-4 flex justify-center items-center text-xs font-normal'>
                                    <Image className="pr-2" src="/eye.svg" alt="eye" width={30} height={30} />
                                    Visa alla
                                </span>
                            </h2>
                        </Link>
                        <div className="grid grid-cols-3 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
                            {event.imageUrls.slice(1, 4).map((url, index) => ( // only display the first 3 images
                                <img 
                                    key={index} 
                                    src={url} 
                                    alt={`Event ${event.event} Image ${index + 1}`} 
                                    onClick={() => openModal(url, event.imageUrls, index)} // Pass the correct index
                                    style={{ cursor: 'pointer' }} 
                                    className='object-cover h-20 w-full rounded-lg shadow-lg mt-2'
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <Modal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                imageUrl={modalImageUrl} 
                imageUrls={modalImageUrls} 
                initialIndex={currentIndex+1} // Pass the initial index to the modal
            />
        </main>
    );
}
