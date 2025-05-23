"use client";
import React, { useState } from "react";
import LogoutButton from "./LogoutBtn";
import Link from "next/link";
import Image from "next/image";
import useAuth from "./useAuth";

export default function Header() {
  const { user } = useAuth();

  // toggle dropdown menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // close dropdown menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="flex justify-between items-center p-4 relative">
      <Link
        href="/home"
        className="flex items-center text-2xl font-bold"
        onClick={closeMenu}
      >
        <Image
          src="/logo.png"
          alt="MTGN24"
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
            className={`absolute top-full right-0 w-full bg-white shadow-md z-10`}
          >
            <div
              className={`transition-all delay-150 duration-200 overflow-hidden w-full ${
                isMenuOpen ? "max-h-[22rem]" : "max-h-0"
              }`}
            >
              <div className="flex flex-col">
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/profil"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Profil
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/event"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Bilder
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/video"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Video
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/n0llegrupper"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    nØllegrupper
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/phosare"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Phösare
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/blandaren"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Bländare
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/calandar"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Calendar
                  </Link>
                </div>
                <div className="w-full px-4 py-2 hover:bg-gray-200">
                  <Link
                    href="/quiz"
                    className="block text-center"
                    onClick={closeMenu}
                  >
                    Namn Quiz
                  </Link>
                </div>
                <div className="flex flex-col w-full px-4 py-2 mt-2 hover:bg-gray-200">
                  <LogoutButton onClose={closeMenu} />
                </div>
              </div>
            </div>
          </div>
          {/* landscape menu */}
          <div className="hidden landscape:flex items-center gap-4">
            <Link
              href="/profil"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Profil
            </Link>
            <Link
              href="/event"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Bilder
            </Link>
            <Link
              href="/video"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Video
            </Link>
            <Link
              href="/n0llegrupper"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              nØllegrupper
            </Link>
            <Link
              href="/phosare"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Phösare
            </Link>
            <Link
              href="/blandaren"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Bländare
            </Link>
            <Link
              href="/calandar"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Kalender
            </Link>
            <Link
              href="/quiz"
              className="text-gray-700 hover:text-blue-400 font-medium transition ease-in-out"
            >
              Namn Quiz
            </Link>
            <LogoutButton />
          </div>
        </>
      )}
    </header>
  );
}
