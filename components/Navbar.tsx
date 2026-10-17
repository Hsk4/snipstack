"use client";

import { Suspense } from "react";
import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

function NavbarContent() {
    const { isLoaded, isSignedIn } = useAuth();

    return (
        <nav className="ss-nav-links">
            <Link href="/dashboard" className="ss-btn ss-btn-ghost">The workspace</Link>
            <Link href="/playground" className="ss-btn ss-btn-ghost">Playground</Link>

            {!isLoaded ? (
                <span className="ss-btn ss-btn-lime ss-btn-skeleton">Start your stack</span>
            ) : isSignedIn ? (
                <>
                    <Link href="/workspace" className="ss-btn ss-btn-lime">Open workspace</Link>
                    <UserButton />
                </>
            ) : (
                <SignInButton mode="modal">
                    <button className="ss-btn ss-btn-lime" type="button">Start your stack</button>
                </SignInButton>
            )}
        </nav>
    );
}

function NavbarFallback() {
    return (
        <nav className="ss-nav-links" aria-hidden>
            <span className="ss-btn ss-btn-ghost ss-btn-skeleton">The workspace</span>
            <span className="ss-btn ss-btn-ghost ss-btn-skeleton">Playground</span>
            <span className="ss-btn ss-btn-lime ss-btn-skeleton">Start your stack</span>
        </nav>
    );
}

export default function Navbar() {
    return (
        <header className="ss-nav">
            <Link href="/" className="ss-brand">
                <strong>snipstack</strong>
                <span className="ss-slash">/</span>
                <span className="ss-muted">a home for your code</span>
            </Link>

            <Suspense fallback={<NavbarFallback />}>
                <NavbarContent />
            </Suspense>
        </header>
    );
}