"use client";
import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  onClose?: () => void; // prop for a function to call on logout, used to close dropdown on click
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onClose }) => {
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      console.log('User signed out');
      onClose?.(); 
      router.push('/'); // redirect to login page
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <button className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out" onClick={handleLogout}>Logga ut</button>
  );
};

export default LogoutButton;