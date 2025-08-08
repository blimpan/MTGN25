"use client"
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import useAuth from '../components/useAuth';
import { ref, uploadBytes } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebaseConfig';
import { getAuth, onAuthStateChanged } from "firebase/auth";

/* Admin page for updating user information, posting new posts and more */
const AdminPanel = () => {
  // for display name
  const [displayNameUid, setDisplayNameUid] = useState('');
  const [displayName, setDisplayName] = useState('');
  // for profile picture
  const [profilePicUid, setProfilePicUid] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scale: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | false>(false);
  // for admin check
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  // for set admin
  const [adminUid, setAdminUid] = useState('');
  // for manage admins
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [manageAdminError, setManageAdminError] = useState('');
  const [manageAdminSuccess, setManageAdminSuccess] = useState('');
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

  // NEW: fetch all admins
  const fetchAdmins = async () => {
    if (!user) return;
    
    setAdminsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/getUsers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only admin users
        const adminUsers = data.users ? data.users.filter((user: any) => user.isAdmin === true) : [];
        setAdmins(adminUsers);
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
      fetchAdmins();
    }
  }, [isAdmin, user]);

  // image change handler
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      
      // Create preview for cropping
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
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

  // NEW: crop and convert profile picture to WebP
  const cropAndConvertProfilePicture = (imageUrl: string, cropData: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Get the displayed image element to calculate scaling
        const displayedImg = document.getElementById('cropImage') as HTMLImageElement;
        if (!displayedImg || !displayedImg.parentElement) {
          reject(new Error('Could not find displayed image or its container'));
          return;
        }

        // Calculate the offset from container to actual image display area
        const imageDisplayWidth = displayedImg.clientWidth;
        const imageDisplayHeight = displayedImg.clientHeight;
        const containerWidth = displayedImg.parentElement.clientWidth;
        const containerHeight = displayedImg.parentElement.clientHeight;
        
        const imageOffsetX = Math.max(0, (containerWidth - imageDisplayWidth) / 2);
        const imageOffsetY = Math.max(0, (containerHeight - imageDisplayHeight) / 2);

        // Adjust crop coordinates by removing the offset
        const adjustedX = cropData.x - imageOffsetX;
        const adjustedY = cropData.y - imageOffsetY;

        // Calculate scale factors from displayed size to natural size
        const scaleX = img.naturalWidth / imageDisplayWidth;
        const scaleY = img.naturalHeight / imageDisplayHeight;
        
        const sourceX = adjustedX * scaleX;
        const sourceY = adjustedY * scaleY;
        const sourceWidth = cropData.width * scaleX;
        const sourceHeight = cropData.width * scaleY; // Use width for both to ensure square

        // Pure crop operation: output exactly what's selected from the original image
        // The output size equals the actual crop area size in the original image
        const actualCropSize = Math.round(sourceWidth);
        
        // Apply maximum size limit for profile pictures (1000x1000)
        const maxOutputSize = 1000;
        const outputSize = Math.min(actualCropSize, maxOutputSize);

        // Set canvas to the output size (either actual crop size or max allowed)
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Crop exactly what was selected, then scale down if necessary
        ctx?.drawImage(
          img,
          Math.round(sourceX),
          Math.round(sourceY),
          Math.round(sourceWidth),  // Square width from original
          Math.round(sourceWidth),  // Square height from original (same as width)
          0,
          0,
          outputSize,
          outputSize
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to crop and convert image'));
            }
          },
          'image/webp',
          0.9 // High quality for profile pictures
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageUrl;
    });
  };

  // NEW: handle crop area updates with constraints
  const updateCropArea = (newCropData: Partial<typeof cropData>) => {
    const img = document.getElementById('cropImage') as HTMLImageElement;
    if (!img || !img.parentElement) return;

    // Get the actual displayed image dimensions
    const imageDisplayWidth = img.clientWidth;
    const imageDisplayHeight = img.clientHeight;
    const containerWidth = img.parentElement.clientWidth;
    const containerHeight = img.parentElement.clientHeight;
    
    // Calculate offset from container to image (for centered images)
    const imageOffsetX = Math.max(0, (containerWidth - imageDisplayWidth) / 2);
    const imageOffsetY = Math.max(0, (containerHeight - imageDisplayHeight) / 2);

    // ENFORCE SQUARE: Always use the same value for width and height
    const maxSquareSize = Math.min(imageDisplayWidth, imageDisplayHeight);
    let newSize = newCropData.width || newCropData.height || cropData.width;
    
    // Ensure the square fits within image bounds
    newSize = Math.max(50, Math.min(maxSquareSize, newSize));
    
    const maxX = imageDisplayWidth - newSize;
    const maxY = imageDisplayHeight - newSize;

    setCropData(prev => ({
      ...prev,
      ...newCropData,
      x: Math.max(imageOffsetX, Math.min(imageOffsetX + maxX, newCropData.x !== undefined ? newCropData.x : prev.x)),
      y: Math.max(imageOffsetY, Math.min(imageOffsetY + maxY, newCropData.y !== undefined ? newCropData.y : prev.y)),
      width: newSize,  // Always square
      height: newSize  // Always square
    }));
  };

  // NEW: handle mouse down on crop area for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = e.currentTarget.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setIsDragging(true);
    setDragStart({ 
      x: mouseX - cropData.x, 
      y: mouseY - cropData.y 
    });
  };

  // NEW: handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const containerRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    if (isDragging) {
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      updateCropArea({ x: newX, y: newY });
    }
  };

  // NEW: handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // NEW: handle corner resize
  const handleCornerMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(corner); // Store which corner is being resized
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // NEW: handle corner resize move - different behavior per corner
  const handleCornerMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Use the larger absolute delta to maintain square aspect ratio
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    
    if (isResizing === 'nw') {
      // Top-left: resize from top-left corner (decrease size = move position)
      const newSize = Math.max(50, cropData.width - delta);
      const sizeDiff = cropData.width - newSize;
      updateCropArea({ 
        x: cropData.x + sizeDiff, 
        y: cropData.y + sizeDiff,
        width: newSize, 
        height: newSize 
      });
    } else if (isResizing === 'sw') {
      // Bottom-left: resize from bottom-left corner
      const newSize = Math.max(50, cropData.width - delta);
      const sizeDiff = cropData.width - newSize;
      updateCropArea({ 
        x: cropData.x + sizeDiff, 
        width: newSize, 
        height: newSize 
      });
    } else {
      // Top-right (ne) and bottom-right (se): resize from right edge (default behavior)
      const newSize = Math.max(50, cropData.width + delta);
      updateCropArea({ width: newSize, height: newSize });
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Use the larger absolute delta to maintain square aspect ratio
        const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
        
        if (isResizing === 'nw') {
          // Top-left: resize from top-left corner (decrease size = move position)
          const newSize = Math.max(50, cropData.width - delta);
          const sizeDiff = cropData.width - newSize;
          updateCropArea({ 
            x: cropData.x + sizeDiff, 
            y: cropData.y + sizeDiff,
            width: newSize, 
            height: newSize 
          });
        } else if (isResizing === 'sw') {
          // Bottom-left: resize from bottom-left corner
          const newSize = Math.max(50, cropData.width - delta);
          const sizeDiff = cropData.width - newSize;
          updateCropArea({ 
            x: cropData.x + sizeDiff, 
            width: newSize, 
            height: newSize 
          });
        } else {
          // Top-right (ne) and bottom-right (se): resize from right edge (default behavior)
          const newSize = Math.max(50, cropData.width + delta);
          updateCropArea({ width: newSize, height: newSize });
        }
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragStart, cropData.width, cropData.x, cropData.y]);

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

  // NEW: remove admin privileges
  const handleRemoveAdmin = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove admin privileges from ${userName}?`)) return;
    if (!user) return;

    // Clear previous messages
    setManageAdminError('');
    setManageAdminSuccess('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/setAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          uid: userId,
          isAdmin: false // Remove admin privileges
        }),
      });

      if (response.ok) {
        setManageAdminSuccess(`Admin privileges removed from ${userName}`);
        fetchAdmins(); // Refresh admins list
      } else {
        const data = await response.json();
        setManageAdminError(data.error || 'Failed to remove admin privileges');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      setManageAdminError('Failed to remove admin privileges');
    }
  };

  // format date for display
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
    
    if (!user) {
      alert("User not authenticated");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/setAdmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: adminUid }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("HTTP error", response.status);
        alert("Failed to set admin: " + (data.error || response.statusText));
        return;
      }

      const data = await response.json();
      console.log("Success:", data);
      alert("User is now an admin.");
      fetchAdmins(); // Refresh admins list
      setAdminUid(''); // Clear the input field
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
        body: JSON.stringify({ uid: displayNameUid, displayName }),
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
    if (imagePreview && profilePicUid && cropData.width > 0) {
      if (!isAdmin) {
        alert("You are not authorized to perform this action.");
        return;
      }

      try {
        // Crop and convert to WebP
        const webpBlob = await cropAndConvertProfilePicture(imagePreview, cropData);
        
        const storageRef = ref(storage, `profilepics/${profilePicUid}.webp`);
        await uploadBytes(storageRef, webpBlob);
        const gsUrl = `gs://${storageRef.bucket}/${storageRef.fullPath}`;
        
        try {
          await updateDoc(doc(db, "users", profilePicUid), {
            profilePic: gsUrl,
          });
          alert("Profile picture updated successfully!");
          
          // Reset form
          setImagePreview(null);
          setShowCropper(false);
          setCropData({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
          setIsDragging(false);
          setIsResizing(false);
          const fileInput = document.getElementById('profilePicture') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
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
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error processing image: ", error);
          alert("Failed to process image: " + error.message);
        }
      }
    } else {
      alert("Please provide a user ID, select an image, and crop it before uploading.");
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
              autoComplete="off"
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
              autoComplete="off"
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
                          autoComplete="off"
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
                          autoComplete="off"
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
              value={displayNameUid}
              onChange={(e) => setDisplayNameUid(e.target.value)}
              autoComplete="off"
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
              autoComplete="off"
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
              value={profilePicUid}
              onChange={(e) => setProfilePicUid(e.target.value)}
              autoComplete="off"
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
              accept="image/*"
              required={!imagePreview}
            />
            <p className="text-xs text-gray-500">
              Image will be cropped to a square and converted to WebP format (up to 1000×1000 pixels)
            </p>
          </div>

          {/* Image Cropping Interface */}
          {showCropper && imagePreview && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Crop Profile Picture (Square Only)</h3>
              
              {/* Image Preview Container */}
              <div 
                className="relative max-w-md mx-auto bg-white rounded border select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  id="cropImage"
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-auto max-h-80 mx-auto pointer-events-none"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.parentElement) return;
                    
                    // Get actual displayed image dimensions
                    const imageDisplayWidth = img.clientWidth;
                    const imageDisplayHeight = img.clientHeight;
                    const containerWidth = img.parentElement.clientWidth;
                    const containerHeight = img.parentElement.clientHeight;
                    
                    // Calculate offset from container to image
                    const imageOffsetX = Math.max(0, (containerWidth - imageDisplayWidth) / 2);
                    const imageOffsetY = Math.max(0, (containerHeight - imageDisplayHeight) / 2);
                    
                    // Calculate crop size (largest square that fits in the image)
                    const size = Math.min(imageDisplayWidth, imageDisplayHeight);
                    
                    // Center the crop area within the actual image bounds
                    const x = imageOffsetX + (imageDisplayWidth - size) / 2;
                    const y = imageOffsetY + (imageDisplayHeight - size) / 2;
                    
                    updateCropArea({
                      x: x,
                      y: y,
                      width: size,
                      height: size
                    });
                  }}
                />
                
                {/* Crop Overlay */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 cursor-move"
                  style={{
                    left: `${cropData.x}px`,
                    top: `${cropData.y}px`,
                    width: `${cropData.width}px`,
                    height: `${cropData.height}px`,
                    minWidth: '50px',
                    minHeight: '50px',
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div 
                    className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize hover:bg-blue-600"
                    onMouseDown={(e) => handleCornerMouseDown(e, 'nw')}
                  ></div>
                  <div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize hover:bg-blue-600"
                    onMouseDown={(e) => handleCornerMouseDown(e, 'ne')}
                  ></div>
                  <div 
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize hover:bg-blue-600"
                    onMouseDown={(e) => handleCornerMouseDown(e, 'sw')}
                  ></div>
                  <div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize hover:bg-blue-600"
                    onMouseDown={(e) => handleCornerMouseDown(e, 'se')}
                  ></div>
                  
                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-50"></div>
                </div>
              </div>

              {/* Crop Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <div className="text-sm text-gray-600">
                    X: {Math.round(cropData.x)}px, Y: {Math.round(cropData.y)}px
                  </div>
                  <div className="text-xs text-gray-500">
                    Drag the blue box to move
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Size</label>
                  <input
                    type="range"
                    min="50"
                    max={(() => {
                      const img = document.getElementById('cropImage') as HTMLImageElement;
                      if (!img) return 500;
                      return Math.min(img.clientWidth, img.clientHeight);
                    })()}
                    value={cropData.width}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      updateCropArea({ width: newSize, height: newSize });
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">
                    {(() => {
                      const img = document.getElementById('cropImage') as HTMLImageElement;
                      if (!img) return `${Math.round(cropData.width)}×${Math.round(cropData.width)}px`;
                      
                      const scaleX = img.naturalWidth / img.clientWidth;
                      const actualCropSize = Math.round(cropData.width * scaleX);
                      const maxOutputSize = 1000;
                      const finalSize = Math.min(actualCropSize, maxOutputSize);
                      
                      if (actualCropSize <= maxOutputSize) {
                        return `Output: ${finalSize}×${finalSize}px`;
                      } else {
                        return `Crop: ${actualCropSize}×${actualCropSize}px → ${finalSize}×${finalSize}px`;
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-center bg-blue-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {(() => {
                    const img = document.getElementById('cropImage') as HTMLImageElement;
                    if (!img) return 'Output Resolution: ?×? pixels WebP';
                    
                    const scaleX = img.naturalWidth / img.clientWidth;
                    const actualCropSize = Math.round(cropData.width * scaleX);
                    const maxOutputSize = 1000;
                    const finalSize = Math.min(actualCropSize, maxOutputSize);
                    
                    if (actualCropSize <= maxOutputSize) {
                      return `Output Resolution: ${finalSize}×${finalSize} pixels WebP`;
                    } else {
                      return `Crop: ${actualCropSize}×${actualCropSize} → Output: ${finalSize}×${finalSize} pixels WebP`;
                    }
                  })()}
                </div>
                <div className="text-xs text-gray-500">
                  💡 Drag the square to move • Drag corners to resize • Use slider above<br/>
                  {(() => {
                    const img = document.getElementById('cropImage') as HTMLImageElement;
                    if (!img) return 'Crop from original, max output 1000×1000';
                    
                    const scaleX = img.naturalWidth / img.clientWidth;
                    const actualCropSize = Math.round(cropData.width * scaleX);
                    const maxOutputSize = 1000;
                    
                    if (actualCropSize <= maxOutputSize) {
                      return 'Pure crop: You get exactly what you select from the original image';
                    } else {
                      return 'Crop from original, then scaled down to fit 1000×1000 limit';
                    }
                  })()}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(false);
                    setImagePreview(null);
                    setIsDragging(false);
                    setIsResizing(false);
                    setCropData({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
                    const fileInput = document.getElementById('profilePicture') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Center the crop area
                    const img = document.getElementById('cropImage') as HTMLImageElement;
                    if (img && img.parentElement) {
                      // Get actual displayed image dimensions
                      const imageDisplayWidth = img.clientWidth;
                      const imageDisplayHeight = img.clientHeight;
                      const containerWidth = img.parentElement.clientWidth;
                      const containerHeight = img.parentElement.clientHeight;
                      
                      // Calculate offset from container to image
                      const imageOffsetX = Math.max(0, (containerWidth - imageDisplayWidth) / 2);
                      const imageOffsetY = Math.max(0, (containerHeight - imageDisplayHeight) / 2);
                      
                      // Calculate crop size (largest square that fits in the image)
                      const size = Math.min(imageDisplayWidth, imageDisplayHeight);
                      
                      // Center the crop area within the actual image bounds
                      const x = imageOffsetX + (imageDisplayWidth - size) / 2;
                      const y = imageOffsetY + (imageDisplayHeight - size) / 2;
                      
                      updateCropArea({
                        x: x,
                        y: y,
                        width: size,
                        height: size
                      });
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                >
                  Auto Center
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!imagePreview || cropData.width === 0}
            className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Update Profile Picture
          </button>
          
          {imagePreview && cropData.width === 0 && (
            <p className="text-yellow-600 text-sm">Please adjust the crop area before uploading.</p>
          )}
        </form>
      </div>

      {/* Manage Admins */}
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Manage Admins</h1>
          <button
            onClick={fetchAdmins}
            disabled={adminsLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400"
          >
            {adminsLoading ? 'Loading...' : 'Refresh Admins'}
          </button>
        </div>

        <div className="space-y-3 max-h-[30rem] overflow-y-auto">
          {admins.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No admin users found</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.uid} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {admin.profilePic ? (
                      <img
                        src={admin.profilePic}
                        alt={admin.displayName || admin.name || admin.username || admin.identifier || admin.email}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-sm">
                          {(admin.displayName || admin.name || admin.username || admin.identifier || admin.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {admin.displayName || admin.name || admin.username || admin.identifier || admin.email || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500">{admin.email || admin.identifier}</p>
                      <p className="text-xs text-gray-400">UID: {admin.uid}</p>
                      {admin.createdAt && (
                        <p className="text-xs text-gray-400">
                          Admin since: {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-end">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        Admin
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAdmin(admin.uid, admin.displayName || admin.name || admin.username || admin.identifier || admin.email || 'Unknown User')}
                      className="bg-red-500 text-white text-sm px-4 py-2 rounded hover:bg-red-600 transition duration-200 min-w-[120px]"
                      disabled={admin.uid === user?.uid} // Prevent removing own admin privileges
                    >
                      {admin.uid === user?.uid ? 'Self' : 'Remove Admin'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Add New Admin Form */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New Admin</h3>
          <form onSubmit={setAdmin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="adminUid" className="block text-gray-700 font-semibold">User ID</label>
              <input
                className="border border-gray-300 rounded-lg p-2 w-full"
                type="text"
                id="adminUid"
                value={adminUid}
                onChange={(e) => setAdminUid(e.target.value)}
                autoComplete="off"
                placeholder="Enter user UID to make admin"
                required
              />
            </div>
            <button type="submit" className="w-full bg-green-500 text-white rounded-lg py-2 hover:bg-green-600 transition duration-200">
              Add Admin
            </button>
          </form>
        </div>
        
        {/* Success/Error messages for manage admins */}
        {manageAdminError && <p className="text-red-500 text-sm mt-4">{manageAdminError}</p>}
        {manageAdminSuccess && <p className="text-green-500 text-sm mt-4">{manageAdminSuccess}</p>}
      </div>
    </main>
  );
};

export default AdminPanel;