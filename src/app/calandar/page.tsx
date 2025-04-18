"use client"
import useAuth from "../components/useAuth";

export default function Calandar() {
  const { user } = useAuth();
  if (!user) return <h1>Please login</h1>;
  
  return (
    <main className="flex min-h-screen min-w-80 flex-col items-center bg-gradient-to-r from-[#A5CACE] to-[#4FC0A0]">
      <iframe
        src="https://embed.styledcalendar.com/#xprZOkwWyOCZ8omjA6Gm"
        title="Styled Calendar"
        className="styled-calendar-container"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
          display: "block",
        }}
        data-cy="calendar-embed-iframe"
      ></iframe>
      <script
        async
        type="module"
        src="https://embed.styledcalendar.com/assets/parent-window.js"
      ></script>
    </main>
  );
}
