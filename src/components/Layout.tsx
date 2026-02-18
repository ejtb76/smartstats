import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Camera, Users, BarChart3, History, Settings, ChevronDown } from 'lucide-react';
import { loadTeams, getActiveTeamId, setActiveTeamId, ensureActiveTeam } from '../hooks/useTeam';

const navItems = [
  { to: '/', icon: Camera, label: 'Analyze' },
  { to: '/roster', icon: Users, label: 'Roster' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  ensureActiveTeam();
  const [teams] = useState(loadTeams);
  const [activeId, setActiveId] = useState(getActiveTeamId);
  const navigate = useNavigate();

  function handleTeamChange(id: string) {
    setActiveTeamId(id);
    setActiveId(id);
    // Force re-render of child routes by navigating
    navigate(0);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-900 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SmartStats</h1>
            <p className="text-blue-200 text-sm">KNBSB Baseball Statistics</p>
          </div>
          {teams.length > 0 && (
            <div className="relative">
              <select
                value={activeId || ''}
                onChange={e => handleTeamChange(e.target.value)}
                className="appearance-none bg-blue-800 text-white border border-blue-700 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300" />
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-48 bg-white border-r border-gray-200 p-4 space-y-1 hidden md:block">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs ${
                isActive ? 'text-blue-900' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
