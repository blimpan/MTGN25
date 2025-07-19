"use client"
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import useAuth from '../components/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebaseConfig';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { set } from 'firebase/database';
import { get } from 'http';

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
  const [loading, setLoading] = useState(true);
  // for posting new posts
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // for event subfolders and uploading event pictures
  const [subfolders, setSubfolders] = useState<string[]>([]);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('');
  const [images, setImages] = useState<FileList | null>(null);


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
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false); // set loading to false if user is not admin
        }
      });
    };

    checkAdminStatus();
  }, []); // run only once

  // fetch event subfolders
  useEffect(() => {
    const fetchSubfolders = async () => {
      try {
        const response = await fetch('/api/getEventSubfolders');
        const data = await response.json();
        //console.log('Subfolders:', data);
        setSubfolders(data);
        if (data.length > 0) {
          setSelectedSubfolder(data[0]); // set the first subfolder as default
        }
      } catch (error) {
        console.error('Error fetching subfolders:', error);
      }
    };
    fetchSubfolders();
  }, []);

  // image change handler
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };
  // image change handler (multiple images)
  const handleImageChangeMultiple = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(e.target.files);
    }
}
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
  
  // upload event pics
  const handleUploadPic = async (event: FormEvent) => {
    event.preventDefault();
    if (images && selectedSubfolder) {
        const formData = new FormData();
        formData.append('subfolder', selectedSubfolder);

        // Append each selected file to the FormData
        for (let i = 0; i < images.length; i++) {
            formData.append('image', images[i]);
        }

        try {
            if (!user){ return <h1>Please login</h1>;} 
            const token = await user.getIdToken();
            const response = await fetch('/api/postEventPic', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
            } else {
                alert(`Failed to upload image: ${result.message}`);
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        }
    } else {
        alert('Please provide both a subfolder and images.');
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
        {/* Upload event picture */}
        <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
          <form onSubmit={handleUploadPic} className="space-y-4">
            <h1 className="mb-3 text-2xl font-semibold text-center">Upload Event Pictures</h1>
            <div className="space-y-2">
              <label htmlFor="subfolder" className="block text-gray-700 font-semibold">Select Event Subfolder</label>
              <select
                className="border border-gray-300 rounded-lg p-2 w-full"
                id="subfolder"
                value={selectedSubfolder}
                onChange={(e) => setSelectedSubfolder(e.target.value)}
                required
              >
                <option value="">Select a subfolder</option>
                {subfolders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="pictures" className="block text-gray-700 font-semibold">Select Pictures</label>
              <input
                className="border border-gray-300 rounded-lg p-2 w-full"
                type="file"
                id="pictures"
                onChange={handleImageChangeMultiple}
                multiple
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200">
              Upload Pictures
            </button>
          </form>
        </div>

        {/*
          <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
          <form onSubmit={handleUploadPic} className="space-y-4">
            <h1 className="mb-3 text-2xl font-semibold text-center">Upload Event Picture</h1>
            <div className="space-y-2">
              <label htmlFor="subfolder" className="block text-gray-700 font-semibold">Select Event Subfolder</label>
              <select
                className="border border-gray-300 rounded-lg p-2 w-full"
                id="subfolder"
                value={selectedSubfolder}
                onChange={(e) => setSelectedSubfolder(e.target.value)}
                required
              >
                <option value="">Select a subfolder</option>
                {subfolders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="picture" className="block text-gray-700 font-semibold">Select Picture</label>
              <input
                className="border border-gray-300 rounded-lg p-2 w-full"
                type="file"
                id="picture"
                onChange={handleImageChange}
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200">
              Upload Picture
            </button>
          </form>
        </div>
*/}
      {/* Upload post */}
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
