import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { WalletConnect } from "./WalletConnect";
import { QuipoLogo } from "./QuipoLogo";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/deposit", label: "Deposit" },
    { path: "/redeem", label: "Redeem" },
    { path: "/transfer", label: "Transfer" },
    { path: "/teleport", label: "Teleport" },
    { path: "/faucet", label: "Faucet" },
    { path: "/create-wallet", label: "Create Wallet" },
    { path: "/email-wallet", label: "Email Wallet" },
    { path: "/history", label: "History" },
    { path: "/admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen text-white relative overflow-hidden crt-screen">
      {/* Data stream effect */}
      <div className="data-stream" />
      
      {/* Animated background gradient */}
      <div className="fixed inset-0 animated-gradient -z-10" />
      
      {/* Hex pattern overlay */}
      <div className="fixed inset-0 hex-pattern opacity-30 -z-10" />
      
      {/* Pattern glare overlay */}
      <div className="fixed inset-0 pattern-glare -z-10" />
      
      {/* Radial glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Header */}
      <header className="glass-strong border-b border-cyan-500/30 sticky top-0 z-50 pattern-glare">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <QuipoLogo />
              <nav className="hidden lg:flex gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded text-sm font-mono transition-all duration-300 ${
                      location.pathname === link.path
                        ? "retro-button text-cyan-400"
                        : "text-cyan-300/70 hover:text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20"
                    }`}
                  >
                    {link.label}
                    {location.pathname === link.path && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-sm -z-10" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden glass border-b border-cyan-500/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded text-xs font-mono whitespace-nowrap transition-all ${
                  location.pathname === link.path
                    ? "retro-button text-cyan-400"
                    : "text-cyan-300/70 hover:text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">{children}</main>
    </div>
  );
}
