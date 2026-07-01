import { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-background border-b border-border"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
            style={{ color: searchFocused ? '#2563EB' : '#475569' }}
          />
          <input
            type="text"
            placeholder="Search anything..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              background: '#FFFFFF',
              border: searchFocused ? '1px solid #2563EB' : '1px solid #E5E7EB',
              color: '#111827',
              boxShadow: searchFocused ? '0 0 0 3px rgba(17,24,39,0.06)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          className="relative p-2 rounded-lg transition-all"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <Bell className="w-4 h-4" style={{ color: '#64748B' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6" style={{ background: '#FFFFFF' }} />

        {/* User menu */}
        <div
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#2563EB' }}
          >
            A
          </div>
          <div className="text-sm">
            <div className="font-medium" style={{ color: '#111827' }}>Admin User</div>
            <div className="text-xs" style={{ color: '#64748B' }}>Super Admin</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5" style={{ color: '#475569' }} />
        </div>
      </div>
    </header>
  );
}
