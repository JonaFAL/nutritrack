'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Hoy', icon: '📊' },
  { href: '/chat', label: 'Chat IA', icon: '💬' },
  { href: '/pantry', label: 'Despensa', icon: '🥩' },
  { href: '/history', label: 'Historial', icon: '📅' },
  { href: '/settings', label: 'Config', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border z-50">
      <div className="max-w-[480px] mx-auto flex">
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
