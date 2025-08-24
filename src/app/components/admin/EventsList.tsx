"use client"
import React from 'react';

interface Event {
  id: string;
  name: string;
  driveUrl: string;
  thumbnailUrl: string;
  eventDate?: string;
  createdAt: string;
  uploadedBy?: {
    username: string;
  };
}

interface EventsListProps {
  events: Event[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string, eventName: string) => void;
}

export default function EventsList({ 
  events, 
  loading, 
  onRefresh, 
  onEdit, 
  onDelete 
}: EventsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Manage Events</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4 max-h-[32rem] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events found</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <img
                  src={event.thumbnailUrl}
                  alt={`${event.name} thumbnail`}
                  className="w-20 h-20 object-cover rounded border flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg">{event.name}</h3>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Event Date:</span> {formatEventDate(event.eventDate)}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span> {formatDate(event.createdAt)}
                    </p>
                    {event.uploadedBy && (
                      <p>
                        <span className="font-medium">Uploaded by:</span> {event.uploadedBy.username}
                      </p>
                    )}
                    <p className="truncate">
                      <span className="font-medium">Drive URL:</span>{' '}
                      <a 
                        href={event.driveUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {event.driveUrl}
                      </a>
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col space-y-2 flex-shrink-0">
                  <button
                    onClick={() => onEdit(event)}
                    className="bg-yellow-500 text-white text-sm px-3 py-2 rounded hover:bg-yellow-600 transition duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(event.id, event.name)}
                    className="bg-red-500 text-white text-sm px-3 py-2 rounded hover:bg-red-600 transition duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
