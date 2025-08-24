"use client"
import React, { useState, FormEvent } from 'react';

export default function UpdateDisplayNameForm() {
  const [displayNameUid, setDisplayNameUid] = useState('');
  const [displayName, setDisplayName] = useState('');

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

  return (
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
  );
}
