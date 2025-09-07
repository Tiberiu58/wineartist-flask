'use client'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="site-header">
      <nav>
        <ul className="menu">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/services">Services</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </nav>
      <style jsx>{`
        .site-header {
          background: #0b0b0d;
          padding: 16px;
        }
        .menu {
          list-style: none;
          display: flex;
          gap: 16px;
          margin: 0;
          padding: 0;
        }
        .menu a {
          color: #eaeaea;
          text-decoration: none;
        }
        .menu a:hover {
          text-decoration: underline;
        }
      `}</style>
    </header>
  )
}
