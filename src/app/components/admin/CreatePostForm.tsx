"use client"
import React, { useState, FormEvent } from 'react';

export default function CreatePostForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUploadPosts = async (event: FormEvent) => {
    event.preventDefault();
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
      setTitle('');
      setDescription('');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
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
  );
}
