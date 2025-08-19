"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import EventsList from './EventsList';
import EditEventModal from './EditEventModal';

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

interface ManageEventsProps {
  refreshTrigger?: number;
}

export default function ManageEvents({ refreshTrigger }: ManageEventsProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [manageEventError, setManageEventError] = useState('');
  const [manageEventSuccess, setManageEventSuccess] = useState('');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    if (!user) return;
    
    setEventsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/getAllEvents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, refreshTrigger]);

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) return;
    if (!user) return;

    setManageEventError('');
    setManageEventSuccess('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/deleteEvent', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      if (response.ok) {
        setManageEventSuccess(`Event "${eventName}" deleted successfully!`);
        fetchEvents();
      } else {
        const errorData = await response.json();
        setManageEventError(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setManageEventError('Failed to delete event');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCloseEditModal = () => {
    setEditingEvent(null);
  };

  const handleEventUpdated = () => {
    fetchEvents();
  };

  const handleEditSuccess = (message: string) => {
    setManageEventSuccess(message);
    setManageEventError('');
  };

  const handleEditError = (message: string) => {
    setManageEventError(message);
    setManageEventSuccess('');
  };

  return (
    <div className="space-y-4">
      <EventsList
        events={events}
        loading={eventsLoading}
        onRefresh={fetchEvents}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Success/Error messages */}
      {manageEventError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {manageEventError}
        </div>
      )}
      {manageEventSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {manageEventSuccess}
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
}
