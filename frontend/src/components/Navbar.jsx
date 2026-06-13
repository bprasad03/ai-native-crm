import { Link, useLocation } from 'react-router-dom'

const links = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/segments', label: 'Segments', icon: '🎯' },
  { path: '/campaigns', label: 'Campaigns', icon: '📣' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">🛍️</div>
          <div>
            <p className="font-bold text-white text-lg leading-none">AI Native CRM</p>
            <p className="text-gray-400 text-xs mt-0.5">AI-Powered Platform</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              location.pathname === link.path
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-xs font-bold">M</div>
          <div>
            <p className="text-white text-sm font-medium">Marketer</p>
            <p className="text-gray-400 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}