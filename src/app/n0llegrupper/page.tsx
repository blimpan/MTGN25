'use client'
import { FormEvent, useEffect, useState } from 'react';
import useAuth from "../components/useAuth";
import { doc, getDoc, setDoc, collection, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { getStorage, ref, getDownloadURL } from "firebase/storage";


export default function N0llegrupper() {

    const [groupBool, setGroupBool] = useState<boolean[]>([]);
    const [groupsData, setGroupsData] = useState<string[]>([]);
    const [userData, setUserData] = useState<DocumentData[]>([]);

    const [popUpBool, setPopUpBool] = useState(false);
    const [popUpName, setPopUpName] = useState("");
    const [popUpPic, setPopUpPic] = useState("");
    const [popUpFunFact, setPopUpFunFact] = useState("");

    const { user } = useAuth();
 
    /* CODE FOR FETCHTING n0llan */
    const [users, setUsers] = useState<{ group: string }[]>([]);
    useEffect(() => {
        const fetchUsers = async () => {

            if (!user) { return } // If middleware.ts is working this should never be executed
            
            if (sessionStorage.getItem("users")) {
                const usersData = sessionStorage.getItem("users");
                if (usersData) {
                    const parsedData = JSON.parse(usersData);
                    setUsers(parsedData);
                    console.log('Loaded users from sessionStorage:')
                    return;
                }
            } else { // If sessionStorage is empty, fetch from API
                
                const token = await user.getIdToken();
                try {
                    const response = await fetch('/api/getUsers', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        //console.log('Users:', data);
                        setUsers(data);
                        console.log('Fetched users from API')
                        sessionStorage.setItem("users", JSON.stringify(data));
                    } else {
                        console.error('Failed to fetch users');
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            }

        };
        fetchUsers();
    }, [user]);

    /* GROUPING n0llan */
    useEffect(() => {
        if (users.length > 0) {
            const groups = users
                .map(obj => obj.group)
                .filter((group, index, self) => self.indexOf(group) === index);

            setGroupsData(groups);
            setUserData(users);
            setGroupBool(Array(groups.length).fill(false));
        }
    }, [users]);


    const toggleGroupBool = (index: number) => {
        setGroupBool(prevState => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            return newState;
        });
    };

    const togglePopUpBool = () => {
        setPopUpBool(!popUpBool);
    };

    async function showUserProfile(profilePic: string, name: string, funFact: string) {
        togglePopUpBool();
        setPopUpPic(profilePic);
        setPopUpName(name);
        setPopUpFunFact(funFact);
    }

    function groupSeparation(group: string, index: number) {

        if (group == undefined) {
            return 
        }
        const groupUsers = userData.filter(user => { if (user.group == group && !user.phosGroup) return user });
        const phosUsers = userData.filter(user => { if (user.group == group && user.phosGroup != "KPH" && user.phosGroup) return user });
        const kphUsers = userData.filter(user => { if (user.group == group && user.phosGroup == "KPH") return user });

        return (
            <div key={group + "1"} className='flex items-center flex-col gap-2 mx-7 sm:mx-16 md:mx-32 lg:mx-64 xl:mx-96 animate-fadeIn'>
            
                <button
                    onClick={() => toggleGroupBool(index)}
                    className="relative bg-cover bg-center bg-almost-black text-white font-medium text-xl mt-4 rounded-lg w-full py-4 whitespace-nowrap hover:bg-gray-900 shadow-pink-glow"
                    style={{ backgroundImage: `url('/n0llegrupper-images/${group}-Cover.webp')` }}
                    >
                    &nbsp;

                    <img
                        src={`/n0llegrupper-images/${group}-Title.webp`}
                        alt={group}
                        className="absolute inset-0 m-auto h-11 pointer-events-none"
                        
                    />

                    <div className='text-right pr-3 pb-3 h-2'>
                        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                        {groupBool[index] ? <i className="material-symbols-outlined">arrow_drop_up</i> : <i className="material-symbols-outlined">arrow_drop_down</i>}
                    </div>
                </button>
                {true && ( // Replace 'true' with groupBool[index] to only load images when the group is expanded
                    <div className={`transition-all delay-150 duration-200 overflow-hidden w-full ${groupBool[index] ? "max-h-[200rem]" : "max-h-0"}`}> {/* KANSKE MÅSTE ÄNDRA VÄRDE PÅ max-h- beroende på hur många som kommer visas upp i animationen */}
                        <div className="grid grid-cols-3 gap-4 lg:grid-cols-4 2xl:grid-cols-5 mt-1">
                            {groupUsers.map((user, index) => (
                                <button onClick={() => showUserProfile(user.profilePic, user.name, user.funFact)} key={index} className={`bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200`}>
                                    <img src={user.profilePic} alt={`User ${index + 1}`} className="w-full aspect-square rounded-lg" />
                                    <h1 className="text-black text-xs pt-2 whitespace-nowrap">{user.name}</h1>
                                </button>
                            ))}

                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3 sm:mx-20 2xl:mx-64 mt-4">
                            {kphUsers.map((user, index) => (
                                <button onClick={() => showUserProfile(user.profilePic, user.name, user.funFact)} key={index} className="bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200">
                                <img src={user.profilePic} alt={user.name} className="w-full aspect-square rounded-lg" />
                                <h1 className="text-black text-xs pt-2 whitespace-nowrap">{user.name}</h1>
                            </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-4 2xl:mx-48">
                            {phosUsers.map((user, index) => (
                                <button onClick={() => showUserProfile(user.profilePic, user.name, user.funFact)} key={index} className="bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200">
                                    <img src={user.profilePic} alt={`User ${index + 1}`} className="w-full aspect-square rounded-lg" />
                                    <h1 className="text-black text-xs pt-2 whitespace-nowrap">{user.name}</h1>
                                </button>
                            ))}
                        </div>
                        <div className='mb-10'></div>
                    </div>
                )}
            </div>
        )
    }

    
    return (
        <main className="min-h-screen bg-gradient-stars pt-3">
            <div>{groupsData.map((group, index) => groupSeparation(group, index))}</div>
            <div onClick={togglePopUpBool} className='flex items-center justify-center '>
                <div className={`fixed aspect-square text-center top-20 h-1/3 sm:h-2/5 drop-shadow  ${popUpBool ? "" : "opacity-0 hidden"}`}>
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:bg-slate-200">
                        <img src={popUpPic} className="w-full aspect-square rounded-lg" />
                        <h1 className="text-black text-xl font-bold p-1">{popUpName}</h1>
                        <h1 className="text-black">Fun fact: {popUpFunFact}</h1>
                    </div>
                </div>
            </div>

        </main>
    )
}
