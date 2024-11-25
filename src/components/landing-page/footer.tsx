import Link from 'next/link'
import { Github } from 'lucide-react'

export function Footer() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/documentation", label: "Documentation" },
    { href: "/guides", label: "Guides" },
    { href: "/help", label: "Help" },
  ]

  return (
    <footer className="border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 justify-center md:justify-start">
            <Link href="/" className="text-sm">
              Composers.dev
            </Link>
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side - Command Menu & Social */}
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-500 hover:text-gray-800">
              Command Menu
            </button>
            <span className="text-gray-300">⌘</span>
            <span className="text-gray-300">K</span>
            <Link 
              href="https://github.com/madebyjace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-800"
            >
              <Github className="h-5 w-5" />
            </Link>
            <span className="text-sm text-gray-500">© 2024</span>
          </div>
        </div>
      </div>
    </footer>
  )
} 