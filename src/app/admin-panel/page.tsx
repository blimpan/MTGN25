"use client"
import React, { useState, useEffect } from 'react';
import useAuth from '../components/useAuth';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  CreateEventForm,
  ManageEvents,
  CreatePostForm,
  UpdateDisplayNameForm,
  UpdateProfilePictureForm,
  ManageAdmins,
  UploadBlandareForm,
  ManageBlandare
} from '../components/admin';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [blandareRefreshTrigger, setBlandareRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
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
        }
      });
    };

    checkAdminStatus();
  }, []);

  const handleEventCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBlandareUploaded = () => {
    setBlandareRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return <h1>Please login</h1>;
  } else if (!isAdmin) {
    return <h1>Only admins can access this page</h1>;
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-stars p-10 space-y-10">
      <CreateEventForm onEventCreated={handleEventCreated} />
      <ManageEvents refreshTrigger={refreshTrigger} />
      <CreatePostForm />
      <UpdateDisplayNameForm />
      <UpdateProfilePictureForm />
      <ManageAdmins />
      <UploadBlandareForm onBlandareUploaded={handleBlandareUploaded} />
      <ManageBlandare refreshTrigger={blandareRefreshTrigger} />
    </main>
  );
};

export default AdminPanel;
