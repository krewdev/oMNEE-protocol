import { ReactNode } from "react";
import { WalletConnect } from "./WalletConnect";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Send, Rocket, Settings, History } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/deposit", label: "Deposit", icon: ArrowDownCircle },
    { path: "/transfer", label: "Transfer", icon: Send },
    { path: "/redeem", label: "Redeem", icon: ArrowUpCircle },
    { path: "/teleport", label: "Teleport", icon: Rocket },
    { path: "/admin", label: "Admin", icon: Settings },
    { path: "/history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      <header className="border-b border-primary-800/50 bg-primary-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">O</span>
                </div>
                <span className="text-xl font-bold">QUIPO Protocol</span>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary-700/50 text-white"
                            : "text-gray-400 hover:text-white hover:bg-primary-800/30"
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-primary-950/95 backdrop-blur-sm border-t border-primary-800/50 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 ${
                    isActive ? "text-primary-400" : "text-gray-500"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

