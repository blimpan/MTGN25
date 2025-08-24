"use client"
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../useAuth';

interface Admin {
  uid: string;
  displayName?: string;
  name?: string;
  username?: string;
  identifier?: string;
  email?: string;
  profilePic?: string;
  createdAt?: string;
}

export default function ManageAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [manageAdminError, setManageAdminError] = useState('');
  const [manageAdminSuccess, setManageAdminSuccess] = useState('');
  const [adminUid, setAdminUid] = useState('');

  const fetchAdmins = async () => {
    if (!user) return;
    
    setAdminsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/getAdmins', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        console.error('Failed to fetch admins:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdmins();
    }
  }, [user]);

  const handleRemoveAdmin = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove admin privileges from ${userName}?`)) return;
    if (!user) return;

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
          isAdmin: false
        }),
      });

      if (response.ok) {
        setManageAdminSuccess(`Admin privileges removed from ${userName}`);
        fetchAdmins();
      } else {
        const data = await response.json();
        setManageAdminError(data.error || 'Failed to remove admin privileges');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      setManageAdminError('Failed to remove admin privileges');
    }
  };

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
      fetchAdmins();
      setAdminUid('');
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
        alert("Failed to set admin: " + error.message);
      }
    }
  };

  return (
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
                    disabled={admin.uid === (user as any)?.uid}
                  >
                    {admin.uid === (user as any)?.uid ? 'Self' : 'Remove Admin'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
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
      
      {manageAdminError && <p className="text-red-500 text-sm mt-4">{manageAdminError}</p>}
      {manageAdminSuccess && <p className="text-green-500 text-sm mt-4">{manageAdminSuccess}</p>}
    </div>
  );
}
