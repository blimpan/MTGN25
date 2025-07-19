import AnslagCard from "./AnslagCard";
import EventCard from "./EventCard";


export default function Home() {
    
    return (
        <main className="flex min-h-screen min-w-80 flex-col items-center bg-gradient-stars animate-fadeIn">
            <div className="flex w-11/12 flex-col mt-5 md:mt-9 max-w-2xl"> {/* EVENT MODULE */}
                <div className="flex flex-row">
                    <p className="font-semibold text-lg text-white drop-shadow-xl sm:text-2xl ml-1">Nästa event</p>
                    <p className="text-2xl sm:text-3xl ml-1">🥳</p>
                </div>
                <div className="flex flex-col space-y-5">
                    <EventCard
                        title="Superroligt event"
                        time="08:00 Måndag"
                        location="Meta"
                        costs="Nej"
                        description="🚶ℹ️ 🍽️"
                        image=""
                        />
                    <EventCard
                        title="Ännu roligare event"
                        time="10:00 Måndag"
                        location="Nymble"
                        costs="Nej"
                        description="🪑💬"
                        image=""
                        />
                </div>
            </div>
            <div className="flex w-11/12 flex-col mt-5 md:mt-9 max-w-2xl mb-5"> {/* EVENT MODULE */}
            <div className="flex flex-row">
                    <p className="font-semibold text-lg text-white drop-shadow-xl sm:text-2xl pl-1">Senaste anslag</p>
                    <p className="text-2xl sm:text-3xl ml-1">📣</p>
                </div>
                
                <div className="flex flex-col space-y-5">
                    <AnslagCard
                        title="Clickbaity titel"
                        description="Om du läser den här texten så har du för mycket fritid. Touch grass <3"
                        createdAt=""/>
                    <AnslagCard
                        title="Använd min kod 'Loke' för 10% rabatt på din nästa Östramacka!"
                        description="Det här anslaget är sponsrat av Lorem Impsum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                        createdAt=""/>
                </div>
            </div>
        </main>
    );
}
