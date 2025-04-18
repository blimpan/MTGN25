'use client';

import { FormEvent, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from "firebase/storage"; 
import { getAuth, onAuthStateChanged, updatePassword } from "firebase/auth";
import { db } from '../lib/firebaseConfig';
import LogoutButton from "../components/LogoutBtn";
import useAuth from "../components/useAuth";
import Link from 'next/link';

const Home = () => {
    const [funFact, setFunFact] = useState<string>(''); 
    const [inputFact, setInputFact] = useState<string>(''); 
    const [inputPassword, setInputPassword] = useState<string>(''); 
    const [inputPassword1, setInputPassword1] = useState<string>(''); 
    const [profilePic, setProfilePic] = useState<string>(''); 
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    
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
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false); 
            }
          });
        };
    
        checkAdminStatus();
      }, []); 

    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                const userProfileRef = doc(db, "users", user.uid);
                try {
                    const docSnap = await getDoc(userProfileRef);
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setFunFact(userData.funFact || '');
                        const picUrl = userData.profilePic;
                        if (picUrl) {
                            const storage = getStorage();
                            const picRef = ref(storage, picUrl);
                            getDownloadURL(picRef)
                                .then((url) => {
                                    setProfilePic(url);
                                })
                                .catch((error) => {
                                    console.error("Error fetching profile picture:", error);
                                });
                        }
                    } else {
                        console.log("No such document!");
                    }
                } catch (error) {
                    console.error("Error fetching fun fact: ", error);
                }
            };

            fetchUserData();
        }
    }, [user]);

    if (!user) {
        return <h1 className="text-center text-2xl text-red-500">Please login.</h1>;  
    }

    const updateFunFact = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (user) {
            const userProfileRef = doc(db, "users", user.uid);
            try {
                await setDoc(userProfileRef, { funFact: inputFact }, { merge: true });
                setFunFact(inputFact); 
                alert("Fun fact updated successfully!");
            } catch (error) {
                console.error("Error updating fun fact: ", error);
                alert("Failed to update fun fact.");
            }
        }
    };

    const newPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (user) {
            if (inputPassword !== inputPassword1) {
                alert("Passwords do not match!");
            } else {
                updatePassword(user, inputPassword).then(() => {
                    alert("Password updated successfully!");
                }).catch((error) => {
                    console.error("Error updating password: ", error);
                    alert("Failed to update password. \nMake sure your password is at least 6 characters long.");
                });
            }
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0] p-10">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 space-y-6">
                {profilePic && (
                    <div className="flex justify-center mb-4">
                        <img src={profilePic} alt="Profile" className="w-36 h-36 rounded-full shadow-lg" />
                    </div>
                )}
                <h2 className="text-lg font-bold text-center text-gray-800">{user?.displayName}</h2>
                <p className="text-center text-gray-600">{"Fun fact: "+funFact || "No fun fact available"}</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-6">
                <form onSubmit={updateFunFact} className="space-y-4">
                    <input
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        type="text"
                        value={inputFact}
                        onChange={(e) => setInputFact(e.target.value)}
                        placeholder="Update Fun Fact"
                        required
                    />
                    <button 
                        type="submit"
                        className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200"
                    >
                        Update Fun Fact
                    </button>
                </form>
            </div>

            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-6">
                <form onSubmit={newPassword} className="space-y-4">
                    <input
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        type="password"
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="New Password"
                        required
                    />
                    <input
                        className="border border-gray-300 rounded-lg p-2 w-full"
                        type="password"
                        onChange={(e) => setInputPassword1(e.target.value)}
                        placeholder="Confirm New Password"
                        required
                    />
                    <button 
                        type="submit"
                        className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200"
                    >
                        Change Password
                    </button>
                </form>
            </div>

            {isAdmin && (
                <div className="w-full max-w-md mt-6">
                    <Link href="/updateUser" className="w-full text-center bg-green-500 text-white rounded-lg py-2 block hover:bg-green-600 transition duration-200">
                        Update User
                    </Link>
                </div>
            )}
        </main>
    );
};

export default Home;
