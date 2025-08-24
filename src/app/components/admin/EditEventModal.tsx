"use client"
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../useAuth';

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

interface EditEventModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onEventUpdated: () => void;
}

export default function EditEventModal({ 
  event, 
  onClose, 
  onSuccess, 
  onError, 
  onEventUpdated 
}: EditEventModalProps) {
  const { user } = useAuth();
  const [editEventName, setEditEventName] = useState('');
  const [editEventDriveUrl, setEditEventDriveUrl] = useState('');
  const [editEventThumbnail, setEditEventThumbnail] = useState<File | null>(null);
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventHour, setEditEventHour] = useState('');
  const [editEventMinute, setEditEventMinute] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (event) {
      setEditEventName(event.name);
      setEditEventDriveUrl(event.driveUrl);
      
      if (event.eventDate) {
        const eventDate = new Date(event.eventDate);
        setEditEventDate(eventDate.toISOString().split('T')[0]);
        setEditEventHour(eventDate.getHours().toString().padStart(2, '0'));
        setEditEventMinute(eventDate.getMinutes().toString().padStart(2, '0'));
      }
    }
  }, [event]);

  const handleUpdateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    onError('');
    onSuccess('');

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      
      formData.append('eventId', event.id);
      formData.append('name', editEventName);
      formData.append('driveUrl', editEventDriveUrl);
      
      if (editEventThumbnail) {
        formData.append('thumbnail', editEventThumbnail);
      }
      
      if (editEventDate && editEventHour && editEventMinute) {
        const eventDateTime = new Date(`${editEventDate}T${editEventHour}:${editEventMinute}`);
        formData.append('eventDate', eventDateTime.toISOString());
      }

      const response = await fetch('/api/updateEvent', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        onSuccess('Event updated successfully!');
        onEventUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        onError(errorData.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      onError('Failed to update event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditEventThumbnail(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Event</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">Event Name</label>
            <input
              type="text"
              value={editEventName}
              onChange={(e) => setEditEventName(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">Drive URL</label>
            <input
              type="url"
              value={editEventDriveUrl}
              onChange={(e) => setEditEventDriveUrl(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">Event Date</label>
            <input
              type="date"
              value={editEventDate}
              onChange={(e) => setEditEventDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1">Hour</label>
              <input
                type="number"
                min="0"
                max="23"
                value={editEventHour}
                onChange={(e) => setEditEventHour(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1">Minute</label>
              <input
                type="number"
                min="0"
                max="59"
                value={editEventMinute}
                onChange={(e) => setEditEventMinute(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">New Thumbnail (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="border border-gray-300 rounded-lg p-2 w-full text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
