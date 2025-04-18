"use client";
import { useEffect, useState } from "react";
import useAuth from "../components/useAuth";

export default function N0llanGrupper() {
  const [users, setUsers] = useState<
    {
      profilePic: string;
      name: string;
      funFact: string;
      phosGroup?: string;
      group: string;
    }[]
  >([]);
  const [filteredUsers, setFilteredUsers] = useState<typeof users>([]);
  const [currentUser, setCurrentUser] = useState<{
    profilePic: string;
    name: string;
    funFact: string;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [userType, setUserType] = useState<string>("all"); // State for user type filter

  const { user } = useAuth();

  // Fetching users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) {
        return <h1>Please login</h1>;
      }
      const token = await user.getIdToken();
      try {
        const response = await fetch("/api/getUsers", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          setFilteredUsers(data); // Initialize with all users
          setNewQuestion(data); // Set a new question when users are fetched
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [user]);

  // Function to set a new question
  const setNewQuestion = (usersArray: typeof users) => {
    // Filter users based on the selected type
    const filtered = usersArray.filter((user) => {
      if (userType === "phosare") {
        return user.phosGroup !== undefined;
      } else if (userType === "n0llan") {
        return user.phosGroup === undefined;
      }
      return true; // For "all", return all users
    });

    if (filtered.length > 0) {
      const randomUser = filtered[Math.floor(Math.random() * filtered.length)];
      setCurrentUser(randomUser);

      // Create options for the user to choose from
      const shuffledUsers = [...filtered].sort(() => 0.5 - Math.random());
      const options = shuffledUsers.slice(0, 4).map((user) => user.name);

      // Ensure the correct answer is in the options
      if (!options.includes(randomUser.name)) {
        options[Math.floor(Math.random() * 4)] = randomUser.name;
      }

      setOptions(options);
      setMessage(""); // Clear any previous message
    }
  };

  // Function to handle the guess
  const handleGuess = (guess: string) => {
    if (currentUser && guess === currentUser.name) {
      setScore((prevScore) => prevScore + 1); // Increase score for correct guess
      setMessage("Correct!");
      setTimeout(() => {
        setNewQuestion(filteredUsers); // Set a new question after a short delay
      }, 1500);
    } else {
      setScore(0); // Reset score for incorrect guess
      setMessage("Wrong, try again.");
    }
  };

  // Handle user type filter change
  const handleUserTypeChange = (type: string) => {
    setUserType(type);
    const newFilteredUsers = users.filter((user) => {
      if (type === "phosare") {
        return user.phosGroup !== undefined;
      } else if (type === "n0llan") {
        return user.phosGroup === undefined;
      }
      return true; // For "all", return all users
    });
    setFilteredUsers(newFilteredUsers);
    setNewQuestion(newFilteredUsers); // Set a new question with the updated filter
  };

  if (!user) {
    return <h1>Please login :|</h1>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0] p-4 flex flex-col items-center justify-center">
      {/* Filter Options */}
      <div className="mb-4">
        <button
          onClick={() => handleUserTypeChange("all")}
          className={`px-4 py-2 mx-2 ${
            userType === "all" ? "bg-blue-700" : "bg-blue-500"
          } text-white font-semibold rounded-lg shadow-md`}
        >
          All Users
        </button>
        <button
          onClick={() => handleUserTypeChange("phosare")}
          className={`px-4 py-2 mx-2 ${
            userType === "phosare" ? "bg-blue-700" : "bg-blue-500"
          } text-white font-semibold rounded-lg shadow-md`}
        >
          Phösare
        </button>
        <button
          onClick={() => handleUserTypeChange("n0llan")}
          className={`px-4 py-2 mx-2 ${
            userType === "n0llan" ? "bg-blue-700" : "bg-blue-500"
          } text-white font-semibold rounded-lg shadow-md`}
        >
          N0llan
        </button>
      </div>

      {currentUser && (
        <div className="bg-white p-4 rounded-lg shadow-lg text-center">
          <img
            src={currentUser.profilePic}
            alt="Who is this?"
            className="w-48 h-48 object-cover rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-gray-800">???</h2>
          <p className="text-gray-600">Fun fact: {currentUser.funFact}</p>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {options.length > 0 ? (
          options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleGuess(option)}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              {option}
            </button>
          ))
        ) : (
          <p className="text-white">Loading options...</p>
        )}
      </div>
      {message && (
        <div className="mt-4 text-lg font-bold text-white">{message}</div>
      )}
      <div className="mt-4 text-lg font-bold text-white">Score: {score}</div>
    </main>
  );
}
