'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useAuth from '../components/useAuth';
import { Event } from '../lib/definitions';

export default function EventGallery() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holeCount, setHoleCount] = useState(19);

  useEffect(() => {
    const updateHoleCount = () => { // Arbirtärt vald mängd hål som skalar med upplösning, tack Copilot
      const width = window.innerWidth;
      if (width < 640) {
        setHoleCount(18); // Small mobile
      } else if (width < 768) {
        setHoleCount(22); // Large mobile
      } else if (width < 1024) {
        setHoleCount(26); // Tablet
      } else {
        setHoleCount(30); // Desktop
      }
    };

    updateHoleCount();
    window.addEventListener('resize', updateHoleCount);
    return () => window.removeEventListener('resize', updateHoleCount);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/getAllEvents', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        
        // Filter events to ensure they have basic required fields
        const validEvents = data.events.filter((event: any) => {
          return event.id && event.name && event.driveUrl;
        });
        
        setEvents(validEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0] flex items-center justify-center">
        <h1 className="text-white text-2xl">Please log in to view events</h1>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0] flex items-center justify-center">
        <h1 className="text-white text-2xl">Loading events...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0] flex items-center justify-center">
        <h1 className="text-white text-2xl">{error}</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-stars p-4 md:p-8">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        {events.length === 0 ? (
          <div className="w-full text-center py-16">
            <h2 className="text-white text-xl md:text-2xl">No events available yet</h2>
          </div>
        ) : (
          (() => {
            // Group events by date and sort by time within each date
            const groupedEvents = events.reduce((groups: { [key: string]: any[] }, event) => {
              const dateToUse = event.eventDate || event.createdAt || new Date().toISOString();
              const eventDate = new Date(dateToUse);
              const validDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;
              const dateKey = validDate.toDateString(); // Use date string as key for grouping
              
              if (!groups[dateKey]) {
                groups[dateKey] = [];
              }
              groups[dateKey].push({ ...event, parsedDate: validDate });
              return groups;
            }, {});

            // Sort events within each date group by time (earliest first)
            Object.keys(groupedEvents).forEach(dateKey => {
              groupedEvents[dateKey].sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
            });

            // Sort date groups (most recent date first)
            const sortedDateKeys = Object.keys(groupedEvents).sort((a, b) => {
              const dateA = new Date(a);
              const dateB = new Date(b);
              return dateB.getTime() - dateA.getTime();
            });

            return sortedDateKeys.map(dateKey => {
              const eventsForDate = groupedEvents[dateKey];
              const firstEvent = eventsForDate[0];
              const dayName = firstEvent.parsedDate.toLocaleDateString('sv-SE', { weekday: 'long' });
              const dayMonth = firstEvent.parsedDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'numeric' });

              return (
                <div key={dateKey} className="relative mb-12 md:mb-16 pb-0.5 md:pb-1">
                  {/* Date header for the group */}
                  <div className="flex items-start mb-6 md:mb-8">
                    <div className="text-white text-2xl md:text-3xl lg:text-4xl font-medium capitalize pr-2 md:pr-4">
                      {dayName} {dayMonth}
                    </div>
                  </div>
                  
                  {/* Timeline - vertical line for the entire date group */}
                  <div className="absolute left-4 md:left-4 top-14 -bottom-0.5 md:-bottom-10 w-2 bg-white"></div>
                  
                  {/* Events for this date */}
                  {eventsForDate.map((event) => {
                    const time = event.parsedDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={event.id} className="mb-8 md:mb-10">
                        {/* Time marker - horizontal line extending right from timeline */}
                        <div className="flex items-center mb-4 md:mb-10">
                          <div className="w-4 md:w-4"></div> {/* Spacer to align with timeline */}
                          <div className="w-8 md:w-12 h-2 bg-white"></div>
                          <div className="text-white ml-2 md:ml-3 text-lg md:text-xl lg:text-2xl">{time}</div>
                        </div>
                        
                        {/* Event name */}
                        <div className="text-white text-xl md:text-2xl lg:text-3xl font-medium mb-4 md:mb-6 ml-16 md:ml-20">
                          {event.name}
                        </div>
                        
                        {/* Film strip card */}
                        <div className="ml-16 md:ml-20">
                          <a
                            href={event.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:scale-105 transition-transform duration-200"
                          >
                            <div className="bg-gray-200 rounded-xl relative overflow-hidden p-0 shadow-pink-glow">
                              {/* Top film strip holes */}
                              <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                                {[...Array(holeCount)].map((_, i) => (
                                  <div key={i} className="w-3 h-4 md:w-4 md:h-5 bg-black rounded"></div>
                                ))}
                              </div>
                              
                              {/* Bottom film strip holes */}
                              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                                {[...Array(holeCount)].map((_, i) => (
                                  <div key={i} className="w-3 h-4 md:w-4 md:h-5 bg-black rounded"></div>
                                ))}
                              </div>
                              
                              {/* Content area */}
                              <div className="mx-2 my-8 md:my-10 flex h-24 md:h-32 lg:h-40">
                                {/* Left black section with "Se bilder" */}
                                <div className="bg-black flex items-center justify-center flex-1">
                                  <div className="flex items-center text-white">
                                    <span className="text-lg md:text-xl lg:text-2xl font-normal mr-3 md:mr-4 text-shadow-pink-glow">Se bilder</span>
                                    <Image
                                      src="/photos icon.svg"
                                      alt="Photos icon"
                                      width={28}
                                      height={28}
                                      className="w-7 h-7 md:w-9 md:h-9 lg:w-11 lg:h-11"
                                      style={{filter: 'drop-shadow(0 0 8px rgba(242, 136, 198, 0.8)) drop-shadow(0 0 15px rgba(242, 136, 198, 0.4))'}}
                                    />
                                  </div>
                                </div>
                                
                                {/* Small white separator */}
                                <div className="w-1 bg-gray-200"></div>
                                
                                {/* Right white section with thumbnail */}
                                <div className="bg-white flex items-center justify-center overflow-hidden flex-1">
                                  {event.thumbnailUrl ? (
                                    <img
                                      src={event.thumbnailUrl}
                                      alt={`${event.name} thumbnail`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-gray-400 text-center">
                                      <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                      </svg>
                                      No image
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()
        )}
      </div>
    </main>
  );
}