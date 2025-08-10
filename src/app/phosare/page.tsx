'use client'
import { FormEvent, useEffect, useState } from 'react';
import useAuth from "../components/useAuth";
import { doc, getDoc, setDoc, collection, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Image from 'next/image';
import { Stardos_Stencil } from "next/font/google";
import { getOrFetchUsers } from "../lib/sessionStorage";

const stardos = Stardos_Stencil({
    weight: ['400', '700'], // Specify the weights you want to use
    subsets: ['latin'],
});

export default function PhosarGrupper() {
    const [groupBool, setGroupBool] = useState<boolean[]>([]);
    const [groupsData, setGroupsData] = useState<string[]>([]);
    const [userData, setUserData] = useState<DocumentData[]>([]);
    const [rsaOpen, setRsaOpen] = useState<boolean>(false); // State to track if RSA is open

    const [popUpBool, setPopUpBool] = useState(false);
    const [popUpName, setPopUpName] = useState("");
    const [popUpPic, setPopUpPic] = useState("");
    const [popUpFunFact, setPopUpFunFact] = useState("");
    const [funFactText, setFunFactText] = useState("Fun fact: "); // Manage funFact text

    const { user } = useAuth();
    const storage = getStorage();

    /* CODE FOR FETCHING PHÖSARE */
    const [users, setUsers] = useState<{ phosGroup: string }[]>([]);
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            try {
                const data = await getOrFetchUsers(user);
                setUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, [user]);

    /* GROUPING PHÖSARE */
    useEffect(() => {
        if (users.length > 0) {
            let groups = users
                .map(obj => obj.phosGroup)
                .filter((phosGroup, index, self) => self.indexOf(phosGroup) === index);

            // Reorder groups: ÖPH first, RSA last
            groups = groups.filter(group => group !== 'ÖPH' && group !== 'RSA'); // Remove ÖPH and RSA
            groups.unshift('ÖPH'); // Add ÖPH at the beginning
            groups.push('RSA'); // Add RSA at the end

            setGroupsData(groups);
            setUserData(users);
            setGroupBool(Array(groups.length).fill(false));
        }
    }, [users]);

    const toggleGroupBool = (index: number, group: string) => {
        setGroupBool(prevState => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            // Set RSA open state based on toggle
            if (group === "RSA") {
                setRsaOpen(newState[index]);
            }
            return newState;
        });
    };

    const togglePopUpBool = () => {
        setPopUpBool(!popUpBool);
    };

    async function showUserProfile(profilePic: string, name: string, funFact: string, group: string) {
        if (group === "RSA") {
            // If the group is RSA, show "Access Denied" GIF and hide funFact
            setPopUpName("Access Denied");
            setPopUpPic("/denied.gif"); // Path to the denied.gif in the public directory
            setPopUpFunFact("");
            setFunFactText(""); // Hide the fun fact text
        } else {
            // Otherwise, show the actual profile
            setPopUpPic(profilePic);
            setPopUpName(name);
            setPopUpFunFact(funFact);
            setFunFactText("Fun fact: "); // Show the fun fact text
        }
        togglePopUpBool();
    }

    function groupSeparation(group: string, index: number) {

        if (group == undefined) {
            return 
        }
        // Grouping phosare into their respective groups and electus
        const phosUsers = userData.filter(user => user.phosGroup == group && !user.isElectus);
        const electusUsers = userData.filter(user => user.phosGroup == group && user.isElectus);

        // Specific styling for RSA, including the Stardos font
        const containerClasses = group === "RSA" ? "grid grid-cols-1 gap-4 mb-3 sm:mx-20 2xl:mx-64 justify-center" : "grid grid-cols-2 gap-4 mb-3 sm:mx-20 2xl:mx-64 justify-center";
        const electusClasses = group === "RSA" ? `bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200 ${stardos.className}` : "bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200";
        const userClasses = group === "RSA" ? `bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200 ${stardos.className}` : "bg-white p-2 rounded-lg drop-shadow hover:bg-slate-200";

        return (
        <div key={group + "1"} className='flex items-center flex-col mx-7 sm:mx-16 md:mx-32 lg:mx-64 xl:mx-96'>
            <button onClick={() => toggleGroupBool(index, group)} className={`bg-white text-black font-normal text-xl mt-4 rounded-lg w-full py-4 whitespace-nowrap drop-shadow hover:bg-slate-200 ${group === "RSA" ? stardos.className : ''}`}>{group}
                <div className='text-right pr-3 pb-3 h-2'>
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                    {groupBool[index] ? <i className="material-symbols-outlined">arrow_drop_up</i> : <i className="material-symbols-outlined">arrow_drop_down</i>}
                </div>
            </button>
            <div className={`transition-all delay-150 duration-200 overflow-hidden w-full ${groupBool[index] ? "max-h-[150rem]" : "max-h-0"}`}>
            
            <h1 className={`text-black whitespace-nowrap text-center text-lg bg-white my-2 py-1 drop-shadow rounded-lg opacity-0 ${group === "RSA" ? stardos.className : ''}`}></h1>
            <div className={containerClasses}>
                    {electusUsers.map((user, index) => (
                        <button onClick={() => showUserProfile(user.profilePic, user.name, user.funFact, group)} key={index} className={electusClasses}>
                            <img 
                                src={user.profilePic} 
                                alt={user.name} 
                                className="w-full aspect-square rounded-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/defaultprofile.svg';
                                }}
                            />
                            <h1 className={`text-black text-xs pt-2 whitespace-nowrap ${group === "RSA" ? stardos.className : ''}`}>{user.name}</h1>
                        </button>
                    ))}
            </div>    
                <div className="grid grid-cols-3 gap-4 lg:grid-cols-4 2xl:grid-cols-5 mt-4">
                    {phosUsers.map((user, index) => (
                        <button onClick={() => showUserProfile(user.profilePic, user.name, user.funFact, group)} key={index} className={userClasses}>
                            <img 
                                src={user.profilePic} 
                                alt={user.name} 
                                className="w-full aspect-square rounded-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/defaultprofile.svg';
                                }}
                            />
                            <h1 className={`text-black text-xs pt-2 whitespace-nowrap ${group === "RSA" ? stardos.className : ''}`}>{user.name}</h1>
                        </button>
                    ))}
                </div>
                <div className='mb-10'></div>
            </div>
        </div>
        )
    }

    if (!user) { return <h1>Please login :|</h1>; } // If middleware.ts is working this should never be rendered
    return (
        <main className={`min-h-screen transition-colors duration-300 ${rsaOpen ? 'bg-black' : 'bg-gradient-stars'}`}>
            <div>{groupsData.map((group, index) => groupSeparation(group, index))}</div>
            <div onClick={togglePopUpBool} className='flex items-center justify-center '>
                <div className={`fixed aspect-square text-center top-20 h-1/3 sm:h-2/5 drop-shadow  ${popUpBool ? "" : "opacity-0 hidden"}`}>
                    <div className="bg-white p-8 rounded-lg shadow-lg hover:bg-slate-200">
                        <img 
                            src={popUpPic} 
                            className="w-full aspect-square rounded-lg"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== '/denied.gif') { // Don't fallback if it's already the denied gif
                                    target.src = '/defaultprofile.svg';
                                }
                            }}
                        />
                        <h1 className="text-black text-xl font-bold p-1">{popUpName}</h1>
                        <h1 className="text-black">{funFactText} {popUpFunFact}</h1>
                    </div>
                </div>
            </div>
        </main>
    )
}
