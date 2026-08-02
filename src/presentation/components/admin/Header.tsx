"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, User, LogOut, Mail, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/application/context/AuthContext';
import { useNotifications } from '@/application/context/NotificationContext';

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
};

// ============================================================================
// ADMIN HEADER COMPONENT
// Kept separate from Booth Owner components to avoid confusion.
// ============================================================================
export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount, recentNotifications, markAsRead } = useNotifications();
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-white border-b border-gray-200"
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
        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setShowBell((v) => !v)}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-gray-50"
            style={{ color: '#475569' }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-0 right-0 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                style={{ background: '#EF4444', border: '2px solid #FFFFFF' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showBell && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 18px 48px rgba(15,23,42,0.16)', zIndex: 60 }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <h3 className="text-sm font-bold" style={{ color: '#111827' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium" style={{ color: '#64748B' }}>{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: '#94A3B8' }}>No notifications</div>
                )}
                {recentNotifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { if (!n.isRead) void markAsRead(n.id); }}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-gray-50"
                    style={{ borderBottom: '1px solid #F8FAFC', background: n.isRead ? 'transparent' : 'rgba(37,99,235,0.03)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: n.isRead ? '#475569' : '#111827', fontWeight: n.isRead ? 400 : 600 }}>{n.title}</p>
                    <p className="text-xs mt-0.5 break-words" style={{ color: '#64748B' }}>{n.content}</p>
                    <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>{new Date(n.createdAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
              style={{ background: '#2563EB' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" /> : getInitials(user?.fullName)}
            </div>
            <div className="text-sm text-left">
              <div className="font-medium truncate max-w-[120px]" style={{ color: '#111827' }}>{user?.fullName ?? "Admin User"}</div>
              <div className="text-xs truncate max-w-[120px]" style={{ color: '#64748B' }}>{user?.role ?? "Super Admin"}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#475569', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 18px 48px rgba(15,23,42,0.16)', zIndex: 60 }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <div className="font-semibold truncate" style={{ color: '#111827', fontSize: '0.875rem' }}>{user?.fullName ?? 'Admin User'}</div>
                <div className="truncate" style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '2px' }}>{user?.email ?? 'No data available'}</div>
              </div>
              <button
                type="button"
                onClick={() => { setProfileOpen(true); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                style={{ color: '#111827', fontSize: '0.875rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <User className="w-4 h-4" style={{ color: '#64748B' }} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50"
                style={{ color: '#EF4444', fontSize: '0.875rem', border: 'none', background: 'transparent', cursor: 'pointer', borderTop: '1px solid #F1F5F9' }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {profileOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, background: 'rgba(15,23,42,0.45)' }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 28px 80px rgba(15,23,42,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white overflow-hidden" style={{ background: '#2563EB' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" /> : getInitials(user?.fullName)}
                </div>
                <div>
                  <h3 className="m-0 text-lg font-semibold" style={{ color: '#111827' }}>{user?.fullName ?? 'Admin User'}</h3>
                  <p className="m-0 text-sm" style={{ color: '#64748B' }}>{user?.role ?? 'Admin'}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm" style={{ color: '#475569' }}>
                <Mail className="w-4 h-4" />
                <span>{user?.email ?? 'No data available'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: '#475569' }}>
                <Shield className="w-4 h-4" />
                <span>{user?.status ?? 'No data available'}</span>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setProfileOpen(false)} className="flex-1 rounded-lg px-4 py-2 font-medium" style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111827' }}>Close</button>
              <button onClick={logout} className="flex-1 rounded-lg px-4 py-2 font-medium" style={{ border: 'none', background: '#EF4444', color: '#FFFFFF' }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
