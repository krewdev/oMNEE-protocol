import { Link } from "react-router-dom";

interface QuipoLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function QuipoLogo({ className = "", showText = true, size = "md" }: QuipoLogoProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <Link to="/" className={`flex items-center gap-4 ${className}`}>
      {/* Logo - Using PNG file */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <img 
          src="/quipo-logo.png" 
          alt="QUIPO Logo" 
          className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
        {/* Glare overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-full blur-sm" />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white tracking-tight font-mono retro-text">
            QUIPO
          </span>
          <span className="text-xs font-medium text-cyan-400/90 tracking-wider uppercase font-mono retro-glow">
            UNIVERSAL
          </span>
        </div>
      )}
    </Link>
  );
}

