const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'presentation', 'components', 'Layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add use client
content = '"use client";\n' + content;

// Replace imports
content = content.replace(/import \{ Outlet, NavLink, useNavigate \} from "react-router";/, 'import Link from "next/link";\nimport { usePathname, useRouter } from "next/navigation";');

// Fix paths
content = content.replace(/\.\.\/\.\.\/context\//g, '@/application/context/');
content = content.replace(/\.\.\/contexts\//g, '@/application/context/');

// Fix Layout props
content = content.replace(/export function Layout\(\) \{/, 'export function Layout({ children }: { children: React.ReactNode }) {');

// Fix hooks
content = content.replace(/const navigate = useNavigate\(\);/, 'const router = useRouter();\n  const pathname = usePathname();');
content = content.replace(/navigate\(/g, 'router.push(');

// Fix Outlet
content = content.replace(/<Outlet \/>/g, '{children}');

// Replace NavLink
content = content.replace(/<NavLink/g, '<Link');
content = content.replace(/<\/NavLink>/g, '</Link>');

// Fix "to="
content = content.replace(/to=\{([^}]+)\}/g, 'href={$1}');

// Fix NavLink className callback (this is tricky, so we use regex to rewrite it to a template literal using pathname)
// Pattern: className={({ isActive }) => `... ${isActive ? "active" : "inactive"}`}
content = content.replace(/className=\{\(\{ isActive \}\) => `([^`]+)\$\{isActive \? ([^:]+) : ([^\}]+)\}`\}/g, 'className={`$1${pathname === item.path || pathname.startsWith(item.path + "/") ? $2 : $3}`}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Layout.tsx ported to Next.js successfully!');
