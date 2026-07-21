/* eslint-disable */
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/application/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Store,
  MessageSquareWarning,
  CreditCard,
  Star,
  Bell,
  Zap,
  Settings,
  FileText,
  Tag,
  Package,
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { id: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: '/admin/accounts', label: 'User Management', icon: Users },
      { id: '/admin/markets', label: 'Night Market Management', icon: MapPin },
      { id: '/admin/booths', label: 'Booth Management', icon: Store },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: '/admin/reviews', label: 'Reviews', icon: Star },
      { id: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: '/admin/packages', label: 'Package Management', icon: Package },
      { id: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { id: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'AI Management',
    items: [
      { id: '/admin/ai-settings', label: 'AI Configuration', icon: Settings },
      { id: '/admin/ai-logs', label: 'AI Logs', icon: FileText },
      { id: '/admin/food-tags', label: 'Food Tags', icon: Tag },
    ],
  },
];

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
};

// ============================================================================
// ADMIN SIDEBAR COMPONENT
// Kept separate from Booth Owner components to avoid confusion.
// ============================================================================
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div
      className="w-64 h-screen flex flex-col flex-shrink-0"
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
      }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: '#2563EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#111827' }}>Smart Night Market</p>
          <p className="text-xs" style={{ color: '#111827' }}>Admin Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p
              className="text-xs uppercase tracking-widest px-3 mb-2"
              style={{ color: '#334155', fontWeight: 600, letterSpacing: '0.1em' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = 'exact' in item && item.exact
                  ? pathname === item.id
                  : pathname.startsWith(item.id);
                const isHovered = hoveredItem === item.id;

                return (
                  <Link
                    key={item.id}
                    href={item.id}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative"
                    style={
                      isActive
                        ? {
                            background: '#F3F4F6',
                            borderLeft: '2px solid #2563EB',
                            color: '#111827',
                          }
                        : isHovered
                        ? {
                            background: '#FFFFFF',
                            color: '#334155',
                            borderLeft: '2px solid transparent',
                          }
                        : {
                            color: '#475569',
                            borderLeft: '2px solid transparent',
                          }
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm text-left flex-1">{item.label}</span>
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#2563EB', boxShadow: '0 0 6px rgba(17,24,39,0.4)' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ borderTop: '1px solid #E5E7EB' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white overflow-hidden"
          style={{ background: '#2563EB' }}
        >
          {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName ?? 'Admin'} className="w-full h-full object-cover" /> : getInitials(user?.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{user?.fullName ?? "Admin User"}</p>
          <p className="text-xs truncate" style={{ color: '#64748B' }}>{user?.role ?? "Super Admin"}</p>
        </div>
      </div>
    </div>
  );
}
