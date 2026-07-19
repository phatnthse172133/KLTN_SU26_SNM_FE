import { useState } from 'react';
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
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'markets', label: 'Night Market Management', icon: MapPin },
      { id: 'booths', label: 'Booth Management', icon: Store },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'reviews', label: 'Reviews', icon: Star },
      { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
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
                const isActive = activeTab === item.id;
                const isHovered = hoveredItem === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    data-mouse-enter={() => setHoveredItem(item.id)}
                    data-mouse-leave={() => setHoveredItem(null)}
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
                  </button>
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
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: '#2563EB' }}
        >
          A
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium Muncate" style={{ color: '#111827' }}>Admin User</p>
          <p className="text-xs Muncate" style={{ color: '#64748B' }}>Super Admin</p>
        </div>
      </div>
    </div>
  );
}
