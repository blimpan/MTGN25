// This component is depricated as of MTGN 2025, since the link was moved to 
// the navbar instead. 2025-06-11

import React from 'react';
import Link from 'next/link';

export default function FloatingButton() {
  return (
    <Link 
      href="https://forms.gle/zDnjmj2kjuQdgNFd9"
      className="
        fixed bottom-5 right-5 
        bg-[#A5CACE] text-white 
        p-3 sm:p-4 md:p-5 
        rounded-full shadow-lg 
        hover:bg-[#4FC0A0] 
        transition duration-300
        text-sm sm:text-base md:text-lg
      "
    >
      ❤️📫
    </Link>
  );
}
