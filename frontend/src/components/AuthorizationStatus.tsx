import { CheckCircle2, XCircle, Shield, Crown } from "lucide-react";
import { useAuthorization } from "../hooks/useContracts";

export function AuthorizationStatus() {
  const { isAuthorized, isOwner, loading } = useAuthorization();

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="h-6 w-32 bg-gray-800/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-xl p-6 border border-gray-700/50 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gray-700/50 rounded-lg">
          {isOwner ? (
            <Crown className="w-5 h-5 text-yellow-400" />
          ) : (
            <Shield className="w-5 h-5 text-gray-300" />
          )}
        </div>
        <div>
          <h3 className="text-sm text-gray-400 font-medium">Authorization Status</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOwner ? "Hub Owner" : "Agent Status"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isAuthorized || isOwner ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-lg font-semibold text-white">
                {isOwner ? "Owner Access" : "Authorized"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isOwner
                  ? "Full administrative access"
                  : "Can deposit, transfer, redeem, and teleport"}
              </p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-lg font-semibold text-white">Not Authorized</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Contact Hub owner to get authorized
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

