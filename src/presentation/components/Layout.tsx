"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoothProvider, useBooth } from "@/application/context/BoothContext";
import { accountService } from "@/application/features/account/accountService";
import {
  AlertCircle,
  Bell,
  Camera,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  HeadphonesIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MenuSquare,
  MessageSquare,
  Package,
  Phone,
  Search,
  Settings,
  Star,
  Store,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/application/context/AuthContext";

const navItems = [
  { name: "Dashboard", path: "/boothowner", icon: LayoutDashboard },
  { name: "My Booth", path: "/boothowner/booth", icon: Store },
  { name: "Menu Management", path: "/boothowner/menu", icon: MenuSquare },
  { name: "Orders", path: "/boothowner/orders", icon: Package },
  { name: "Promotions", path: "/boothowner/promotions", icon: Gift },
  { name: "Chat", path: "/boothowner/messages", icon: MessageSquare },
  { name: "Reviews", path: "/boothowner/reviews", icon: Star },
  { name: "Sales & Analytics", path: "/boothowner/analytics", icon: TrendingUp },
  { name: "Subscription Packages", path: "/boothowner/fees", icon: CreditCard },
  { name: "Support", path: "/boothowner/support", icon: HeadphonesIcon },
  { name: "Settings", path: "/boothowner/settings", icon: Settings },
];

const searchableRoutes = navItems.map((item) => ({
  type: item.name.includes("Menu") ? "menu" : item.name.includes("Booth") ? "booth" : "page",
  label: item.name,
  sub: "No API search data connected",
  path: item.path,
}));

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
};

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ProfileModal({ onClose, initialTab = "profile" }: { onClose: () => void; initialTab?: "profile" | "password" }) {
  const { logout, user, refreshUser } = useAuth();
  const { selectedBooth } = useBooth();
  const [activeTab, setActiveTab] = useState<"profile" | "password">(initialTab);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    setName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const saveProfile = async () => {
    setProfileError("");
    try {
      await accountService.updateMyAccount({ fullName: name, phone });
      await refreshUser();
      setEditing(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile.");
    }
  };

  const savePassword = async () => {
    setPwError("");
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    try {
      await accountService.changePassword({ currentPassword: currentPw, newPassword: newPw, confirmNewPassword: confirmPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (error) {
      setPwError(error instanceof Error ? error.message : "Failed to update password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">My Account</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center pt-6 pb-4 px-6">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-[72px] h-[72px] rounded-full object-cover" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                {getInitials(user?.fullName)}
              </div>
            )}
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow-md flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 border-2 border-white transition-colors">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          </div>
          <p className="text-sm font-bold text-gray-900 mt-3">{user?.fullName ?? "No user data"}</p>
          <p className="text-xs text-gray-400">{user?.email ?? "No email data"}</p>
        </div>

        <div className="flex border-b border-gray-100 mx-6">
          {([
            { key: "profile", label: "Profile Info", icon: User },
            { key: "password", label: "Change Password", icon: Lock },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <>
            <div className="px-6 pt-5 pb-4 space-y-4">
              {profileSaved && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2.5 text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> Profile updated successfully</div>}
              {profileError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm"><AlertCircle className="w-4 h-4" /> {profileError}</div>}
              {[
                { label: "Full Name", value: name, onChange: setName, icon: User },
                { label: "Phone", value: phone, onChange: setPhone, icon: Phone },
                { label: "Email", value: email, onChange: setEmail, icon: Mail, readonly: true },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">{f.label}</label>
                  <div className="relative">
                    <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={f.value} onChange={(e) => f.onChange(e.target.value)} disabled={!editing || f.readonly} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-6 mb-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-400 font-medium">Active Booth</p>
                <p className="text-sm font-bold text-indigo-800 mt-0.5">{selectedBooth?.boothName ?? "No data from API"}</p>
              </div>
              <Link href="/booth" onClick={onClose} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5">
                View <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={saveProfile} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition-colors">Save Changes</button>
                </>
              ) : (
                <>
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"><LogOut className="w-4 h-4" /> Log Out</button>
                  <button onClick={() => setEditing(true)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition-colors">Edit Profile</button>
                </>
              )}
            </div>
          </>
        )}

        {activeTab === "password" && (
          <div className="px-6 pt-5 pb-6 space-y-4">
            {pwError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwError}</div>}
            {pwSaved && <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2.5 text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> Password updated successfully</div>}
            <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Current Password</label><PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Enter current password" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">New Password</label><PasswordInput value={newPw} onChange={setNewPw} placeholder="At least 6 characters" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Confirm New Password</label><PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Re-enter new password" /></div>
            <button onClick={savePassword} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition-colors mt-2">Update Password</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [profileModal, setProfileModal] = useState<null | "profile" | "password">(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim().length > 0
    ? searchableRoutes.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setShowAvatarMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <BoothProvider>
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
        <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Smart Night Market</h1>
            <p className="text-sm font-medium text-indigo-600 mt-1">Booth Dashboard</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
              return (
                <Link key={item.name} href={item.path} className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-40">
            <div className="flex-1 max-w-lg relative" ref={searchRef}>
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} placeholder="Search pages..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm" />
              {searchQuery && <button onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {searchResults.map((item) => (
                    <Link key={item.path} href={item.path} onClick={() => { setSearchQuery(""); setShowSearch(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50"><Search className="w-3.5 h-3.5 text-indigo-600" /></div>
                      <div className="min-w-0"><p className="text-sm font-semibold text-gray-900">{item.label}</p><p className="text-xs text-gray-400 truncate">{item.sub}</p></div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
              {showSearch && searchQuery.trim().length > 0 && searchResults.length === 0 && <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-4 py-6 text-center text-sm text-gray-400">No data from API</div>}
            </div>

            <div className="flex items-center gap-5 ml-4">
              <div className="relative" ref={bellRef}>
                <button onClick={() => { setShowBell(!showBell); setShowAvatarMenu(false); }} className="relative text-gray-500 hover:text-gray-700 p-1"><Bell className="w-5 h-5" /></button>
                {showBell && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Notifications</h3></div>
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No data from API</div>
                  </div>
                )}
              </div>

              <div className="relative border-l border-gray-200 pl-5" ref={avatarRef}>
                <button onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowBell(false); }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">{user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" /> : getInitials(user?.fullName)}</div>
                  <div className="text-left hidden lg:block"><p className="text-sm font-semibold text-gray-900 leading-none">{user?.fullName ?? "No user data"}</p><p className="text-xs text-gray-400 mt-0.5">{user?.role ?? "Booth Owner"}</p></div>
                </button>
                {showAvatarMenu && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{getInitials(user?.fullName)}</div><div className="min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName ?? "No user data"}</p><p className="text-xs text-gray-400 truncate">{user?.email ?? "No email data"}</p></div></div></div>
                    <div className="py-1.5">
                      <button onClick={() => { setProfileModal("profile"); setShowAvatarMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><User className="w-4 h-4 text-gray-400" /> My Profile</button>
                      <button onClick={() => { setProfileModal("password"); setShowAvatarMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><Lock className="w-4 h-4 text-gray-400" /> Change Password</button>
                    </div>
                    <div className="border-t border-gray-100 py-1.5"><button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" /> Log Out</button></div>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-gray-50">{children}</div>
        </main>
      </div>
      {profileModal && <ProfileModal initialTab={profileModal} onClose={() => setProfileModal(null)} />}
    </BoothProvider>
  );
}
