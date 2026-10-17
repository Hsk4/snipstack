import Link from "next/link";

export default function Footer() {
    return (
        <footer className="ss-footer">
            <strong>snipstack</strong>
            <span className="ss-muted">Built for developers who ship.</span>
            <Link href="/workspace" className="ss-footer-link">Open workspace</Link>
        </footer>
    );
}