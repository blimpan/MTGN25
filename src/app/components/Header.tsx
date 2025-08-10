"use client";
import React, { useState } from "react";
import LogoutButton from "./LogoutBtn";
import Link from "next/link";
import Image from "next/image";
import useAuth from "./useAuth";

const NAV_LINKS = [
  { href: "/profil", label: "Profil", target: "_self" },
  { href: "/event", label: "Bilder", target: "_self" },
  { href: "/n0llegrupper", label: "nØllegrupper", target: "_self" },
  { href: "/phosare", label: "Phösare", target: "_self" },
  { href: "/blandaren", label: "Bländare", target: "_self" },
  { href: "/quiz", label: "Namnquiz", target: "_self" },
  { href: "https://forms.gle/yWqqumMhmq96T6Sm7", label: "På-Hjärtat-Lådan", target: "_blank" }
];

export default function Header() {
  const { user } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // toggle dropdown menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // close dropdown menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-[#70258F] drop-shadow-homeShadow text-amber-50 fixed top-0 left-0 w-full z-50">
      <Link
        href="/home"
        className="flex items-center text-2xl font-bold"
        onClick={closeMenu}
      >
        <Image
          src="/logo.png"
          alt="MTGN25"
          width={32}
          height={32}
          className="mr-2 ml-4"
        />
        MTGN25
      </Link>
      {user && (
        <>
          <button className="md:hidden portrait:block" onClick={toggleMenu}>
            {/* hamburger icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
          {/* dropdown menu */}
          <div
            className={`absolute top-full right-0 w-full bg-darker-purple shadow-md z-10`}
          >
            <div
              className={`transition-all delay-150 duration-200 overflow-hidden w-full ${
                isMenuOpen ? "max-h-[30rem]" : "max-h-0" // set max height to something large when opening to enable transition animation
              }`}
            >
              <div className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <div key={link.href} className="w-full px-4 py-2">
                    <Link
                      href={link.href}
                      target={link.target}
                      className="block text-center hover:text-amber-100 font-medium"
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  </div>
                ))}
                <div className="flex flex-col w-full px-4 py-2 mt-2">
                  <LogoutButton onClose={closeMenu} />
                </div>
              </div>
            </div>
          </div>
          {/* landscape menu */}
          <div className="hidden landscape:flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.target}
                className="hover:text-amber-100 font-medium transition ease-in-out"
              >
                {link.label}
              </Link>
            ))}
            <LogoutButton />
          </div>
        </>
      )}
    </header>
  );
}
