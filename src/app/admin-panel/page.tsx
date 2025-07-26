"use client"
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import useAuth from '../components/useAuth';
import { ref, uploadBytes } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebaseConfig';
import { getAuth, onAuthStateChanged } from "firebase/auth";

/* Admin page for updating user information, posting new posts and more */
const AdminPanel = () => {
  const [uid, setUid] = useState('');
  // for display name
  const [displayName, setDisplayName] = useState('');
  // for profile picture
  const [image, setImage] = useState<File | null>(null);
  // for admin check
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  // for posting new posts
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // for creating events
  const [eventName, setEventName] = useState('');
  const [eventDriveUrl, setEventDriveUrl] = useState('');
  const [eventThumbnail, setEventThumbnail] = useState<File | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [eventHour, setEventHour] = useState('');
  const [eventMinute, setEventMinute] = useState('');
  const [eventError, setEventError] = useState('');
  const [eventSuccess, setEventSuccess] = useState('');

  // for managing events
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [manageEventError, setManageEventError] = useState('');
  const [manageEventSuccess, setManageEventSuccess] = useState('');

  // for editing events
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // separate state for editing (to avoid conflicts with create form)
  const [editEventName, setEditEventName] = useState('');
  const [editEventDriveUrl, setEditEventDriveUrl] = useState('');
  const [editEventThumbnail, setEditEventThumbnail] = useState<File | null>(null);
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventHour, setEditEventHour] = useState('');
  const [editEventMinute, setEditEventMinute] = useState('');


  // check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        // get user auth token and send to API endpoint /api/isAdmin
        if (user) {
          try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/isAdmin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
            });

            if (!response.ok) {
              // Error response from the server, only for debugging
              console.error('Response error:', response.status, response.statusText);
              const errorText = await response.text(); 
              console.error('Response text:', errorText);
              throw new Error('Failed to fetch admin status');
            }

            const data = await response.json();
            setIsAdmin(data.isAdmin);
            console.log("Admin status:", data.isAdmin);
          } catch (error) {
            console.error('Error:', error);
          }
        } else {
          // No action needed if user is not logged in
        }
      });
    };

    checkAdminStatus();
  }, []); // run only once

  // NEW: fetch events for management
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
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin, user]);

  // image change handler
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  // NEW: event thumbnail change handler
  const handleEventThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEventThumbnail(e.target.files[0]);
    }
  };

  // NEW: edit event thumbnail change handler
  const handleEditEventThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditEventThumbnail(e.target.files[0]);
    }
  };

  // NEW: convert image to WebP format
  const convertToWebP = (file: File, quality: number = 0.8, maxWidth: number = 800, maxHeight: number = 600): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // NEW: create new event
  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault();
    setEventError('');
    setEventSuccess('');

    if (!eventThumbnail || !eventName || !eventDriveUrl || !eventDate || !eventHour || !eventMinute) {
      setEventError('Please fill in all fields and select a thumbnail image.');
      return;
    }

    try {
      const webpBlob = await convertToWebP(eventThumbnail);
      
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(webpBlob);
      });

      const eventDateTime = new Date(`${eventDate}T${eventHour.padStart(2, '0')}:${eventMinute.padStart(2, '0')}`);

      if (!user) {
        setEventError('User not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/createEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: eventName,
          driveUrl: eventDriveUrl,
          thumbnailData: base64Data,
          thumbnailFileName: eventThumbnail.name,
          eventDate: eventDateTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setEventSuccess('Event created successfully!');
      fetchEvents(); // Refresh events list

      // Clear form
      setEventName('');
      setEventDriveUrl('');
      setEventThumbnail(null);
      setEventDate('');
      setEventHour('');
      setEventMinute('');
      const fileInput = document.getElementById('eventThumbnail') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error creating event:', error);
      setEventError((error as Error).message);
    }
  };

  // NEW: delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    if (!user) return;

    // Clear previous messages
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
        setManageEventSuccess('Event deleted successfully!');
        fetchEvents(); // Refresh events list
      } else {
        setManageEventError('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setManageEventError('Failed to delete event');
    }
  };

  // NEW: start editing an event
  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    
    // Pre-fill EDIT form with existing event data (not create form)
    setEditEventName(event.name);
    setEditEventDriveUrl(event.driveUrl);
    
    // Parse the event date
    const eventDate = new Date(event.eventDate || event.createdAt);
    setEditEventDate(eventDate.toISOString().split('T')[0]); // YYYY-MM-DD format
    setEditEventHour(eventDate.getHours().toString().padStart(2, '0'));
    setEditEventMinute(eventDate.getMinutes().toString().padStart(2, '0'));
    
    // Clear thumbnail (user needs to re-upload if they want to change it)
    setEditEventThumbnail(null);
    
    // Clear messages
    setEventError('');
    setEventSuccess('');
    setManageEventError('');
    setManageEventSuccess('');
  };

  // NEW: cancel editing
  const handleCancelEdit = () => {
    setEditingEvent(null);
    
    // Clear edit form data (separate from create form)
    setEditEventName('');
    setEditEventDriveUrl('');
    setEditEventThumbnail(null);
    setEditEventDate('');
    setEditEventHour('');
    setEditEventMinute('');
    setEventError('');
    setEventSuccess('');
    setManageEventError('');
    setManageEventSuccess('');
  };

  // NEW: update existing event
  const handleUpdateEvent = async (event: FormEvent) => {
    event.preventDefault();
    setEventError('');
    setEventSuccess('');

    if (!editEventName || !editEventDriveUrl || !editEventDate || !editEventHour || !editEventMinute) {
      setEventError('Please fill in all required fields.');
      return;
    }

    try {
      let thumbnailData = null;
      
      // Only process new thumbnail if one was selected
      if (editEventThumbnail) {
        const webpBlob = await convertToWebP(editEventThumbnail);
        
        const reader = new FileReader();
        thumbnailData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(webpBlob);
        });
      }

      const eventDateTime = new Date(`${editEventDate}T${editEventHour.padStart(2, '0')}:${editEventMinute.padStart(2, '0')}`);

      if (!user) {
        setEventError('User not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/updateEvent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: editingEvent.id,
          name: editEventName,
          driveUrl: editEventDriveUrl,
          thumbnailData: thumbnailData,
          thumbnailFileName: editEventThumbnail?.name,
          eventDate: eventDateTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      setEventSuccess('Event updated successfully!');
      setManageEventSuccess('Event updated successfully!');
      fetchEvents(); // Refresh events list
      handleCancelEdit(); // Exit edit mode
    } catch (error) {
      console.error('Error updating event:', error);
      setEventError((error as Error).message);
    }
  };

  // NEW: format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }) + ' kl. ' + date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // set user as admin
  const setAdmin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/setAdmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        console.error("HTTP error", response.status);
        alert("Failed to set admin: " + response.statusText);
        return;
      }

      const data = await response.json();
      console.log("Success:", data);
      alert("User is now an admin.");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
        alert("Failed to set admin: " + error.message);
      }
    }
  };
  // update user display name
  const handleSubmitName = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/updateDisplayName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid, displayName }),
      });

      if (!response.ok) {
        console.error("HTTP error", response.status);
        alert("Failed to update user: " + response.statusText);
        return;
      }

      const data = await response.json();
      console.log("Success:", data);
      alert("User updated successfully!");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error);
        alert("Failed to update user: " + error.message);
      }
    }
  };
  // upload profile picture
  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (image && uid) {
      if (!isAdmin) {
        alert("You are not authorized to perform this action.");
        return;
      }

      const storageRef = ref(storage, `profilepics/${uid}`);
      try {
        await uploadBytes(storageRef, image);
        const gsUrl = `gs://${storageRef.bucket}/${storageRef.fullPath}`;
        try {
          await updateDoc(doc(db, "users", uid), {
            profilePic: gsUrl,
          });
        } catch (error) {
          if (error instanceof Error) {
            console.error(
              "Error updating profile picture URL in Firestore: ",
              error
            );
            alert(
              "Failed to update profile picture URL in Firestore: " +
                error.message
            );
          }
        }
        alert("Profile picture updated successfully!");
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error uploading image: ", error);
          alert("Failed to upload image: " + error.message);
        }
      }
    } else {
      alert("Please provide both a user ID and a profile picture.");
    }
  };
  
  // upload posts
  const handleUploadPosts = async (event: FormEvent) => {
    event.preventDefault();
    // user feedback if post is created successfully or not
    /* OM NGN HAR TID KAN NI FIXA SÅNNA HÄR PÅ DE ANDRA HANDLERNSERNA? */
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/postPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }), 
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess('Post created successfully!');
      // clear input fields
      setTitle('');
      setDescription('');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  if (!user) {
    return <h1>Please login</h1>; // If middleware.ts is working this should never be rendered
  } else if (!isAdmin) {
    return <h1>Only admins can access this page</h1>;
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-stars p-10 space-y-10">
      {/* NEW: Create New Event */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <h1 className="mb-3 text-2xl font-semibold text-center">Create New Event</h1>
          <div className="space-y-2">
            <label htmlFor="eventName" className="block text-gray-700 font-semibold">Event Name</label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name"
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="eventDriveUrl" className="block text-gray-700 font-semibold">Google Drive Link</label>
            <input
              type="url"
              id="eventDriveUrl"
              value={eventDriveUrl}
              onChange={(e) => setEventDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
            <p className="text-xs text-gray-500">
              Make sure the folder is set to "Anyone with the link can view"
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="eventDate" className="block text-gray-700 font-semibold">Event Date</label>
            <input
              type="date"
              id="eventDate"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-gray-700 font-semibold">Event Time</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hour</label>
                <select
                  value={eventHour}
                  onChange={(e) => setEventHour(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                  required
                >
                  <option value="">Hour</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minute</label>
                <select
                  value={eventMinute}
                  onChange={(e) => setEventMinute(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 w-full"
                  required
                >
                  <option value="">Minute</option>
                  {['00', '15', '30', '45'].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="eventThumbnail" className="block text-gray-700 font-semibold">Thumbnail Image</label>
            <input
              type="file"
              id="eventThumbnail"
              onChange={handleEventThumbnailChange}
              accept="image/*"
              className="border border-gray-300 rounded-lg p-2 w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white rounded-lg py-2 hover:bg-green-600 transition duration-200"
          >
            Create Event
          </button>

          {eventError && <p className="text-red-500">{eventError}</p>}
          {eventSuccess && <p className="text-green-500">{eventSuccess}</p>}
        </form>
      </div>

      {/* NEW: Manage Events */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Manage Events</h1>
          <button
            onClick={fetchEvents}
            disabled={eventsLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400"
          >
            {eventsLoading ? 'Loading...' : 'Refresh Events'}
          </button>
        </div>

        <div className="space-y-3 max-h-[30rem] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No events found</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-3">
                {editingEvent?.id === event.id ? (
                  // Edit mode for this event
                  <form onSubmit={handleUpdateEvent} className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Edit Event</h3>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm">Event Name</label>
                        <input
                          type="text"
                          value={editEventName}
                          onChange={(e) => setEditEventName(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 w-full text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm">Google Drive Link</label>
                        <input
                          type="url"
                          value={editEventDriveUrl}
                          onChange={(e) => setEditEventDriveUrl(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 w-full text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm">Event Date</label>
                        <input
                          type="date"
                          value={editEventDate}
                          onChange={(e) => setEditEventDate(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 w-full text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm">Event Time</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editEventHour}
                            onChange={(e) => setEditEventHour(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full text-sm"
                            required
                          >
                            <option value="">Hour</option>
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editEventMinute}
                            onChange={(e) => setEditEventMinute(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 w-full text-sm"
                            required
                          >
                            <option value="">Minute</option>
                            {['00', '15', '30', '45'].map((minute) => (
                              <option key={minute} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm">Thumbnail Image</label>
                        <input
                          type="file"
                          onChange={handleEditEventThumbnailChange}
                          accept="image/*"
                          className="border border-gray-300 rounded-lg p-2 w-full text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to keep current thumbnail
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 text-sm"
                      >
                        Update Event
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {eventError && <p className="text-red-500 text-sm">{eventError}</p>}
                    {eventSuccess && <p className="text-green-500 text-sm">{eventSuccess}</p>}
                  </form>
                ) : (
                  // Display mode for this event
                  <div className="flex items-center space-x-3">
                    <img
                      src={event.thumbnailUrl}
                      alt={event.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatEventDate(event.eventDate || event.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created by: {event.uploadedBy?.username || 'Unknown'}
                      </p>
                      <a
                        href={event.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Drive Folder →
                      </a>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="bg-blue-500 text-white text-sm px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="bg-red-500 text-white text-sm px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Success/Error messages for manage events */}
        {manageEventError && <p className="text-red-500 text-sm mt-4">{manageEventError}</p>}
        {manageEventSuccess && <p className="text-green-500 text-sm mt-4">{manageEventSuccess}</p>}
      </div>

      {/* EXISTING: Upload post */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <form onSubmit={handleUploadPosts} className="space-y-4">
          <h1 className="mb-3 text-2xl font-semibold text-center">Create Post</h1>
          <div className="space-y-2">
            <label htmlFor="title" className="block text-gray-700 font-semibold">Title</label>
            <input
              className="border border-gray-300 rounded-lg p-2 w-full"
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="post" className="block text-gray-700 font-semibold">Post</label>
            <textarea
              className="border border-gray-300 rounded-lg p-2 text-black w-full h-64 resize-none"
              id="post"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200">Create Post</button>
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
        </form>
      </div>
      {/* Update user display name */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <form onSubmit={handleSubmitName} className="space-y-4">
          <h1 className="mb-3 text-2xl font-semibold text-center">Update User DisplayName</h1>
          <div className="space-y-2">
            <label htmlFor="uid" className="block text-gray-700 font-semibold">User ID</label>
            <input
              className="border border-gray-300 rounded-lg p-2 w-full"
              type="text"
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-gray-700 font-semibold">Display Name</label>
            <input
              className="border border-gray-300 rounded-lg p-2 w-full"
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200">Update User</button>
        </form>
      </div>
      {/* Upload profile picture */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <h1 className="mb-3 text-2xl font-semibold text-center">Update User ProfilePic</h1>
          <div className="space-y-2">
            <label htmlFor="uid" className="block text-gray-700 font-semibold">User ID</label>
            <input
              className="border border-gray-300 rounded-lg p-2 w-full"
              type="text"
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="profilePicture" className="block text-gray-700 font-semibold">Profile Picture</label>
            <input
              className="border border-gray-300 rounded-lg p-2 w-full"
              type="file"
              id="profilePicture"
              onChange={handleImageChange}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200">Update Profile Picture</button>
        </form>
      </div>
      {/* Set user as admin */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <form onSubmit={setAdmin} className="space-y-4">
          <h1 className="mb-3 text-2xl font-semibold text-center">Set User as Admin</h1>
          <div className="space-y-2">
            <label htmlFor="uid" className="block text-gray-700 font-semibold">User ID</label>
            <input
              className="border border-gray-300 rounded-lg p-2 w-full"
              type="text"
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200">Set Admin</button>
        </form>
      </div>
    </main>
  );
};

export default AdminPanel;