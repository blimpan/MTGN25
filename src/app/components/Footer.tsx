'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex flex-wrap justify-start items-center">
                <p className="pr-2">&copy; {new Date().getFullYear()} MTGN24. All rights reserved.</p>
                <p className="pr-2">Sponsorer:</p>
                <div className="flex flex-wrap items-center space-x-1 sm:space-x-3">
                    <Image className="pr-2 mb-2" src="/skry.svg" alt="SKRY" width={90} height={50} />
                    <Image className="pr-2 mb-2" src="/si.png" alt="Sveriges Ingenjörer" width={160} height={50} />
                    <Image className="pr-2 mb-2" src="/svt.png" alt="SVT" width={55} height={50} />
                    <Image className="pr-2 mb-1" src="/mpya.svg" alt="MPYA" width={90} height={50} />
                </div>
            </div>
        </footer>
    );
}
