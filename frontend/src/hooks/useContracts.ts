import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { getHubContract, getOmTokenContract, getMneeContract, HUB_ADDRESS } from "../utils/contracts";

export function useContracts() {
  const { provider, signer } = useWeb3();
  const [hubContract, setHubContract] = useState<ethers.Contract | null>(null);
  const [omTokenContract, setOmTokenContract] = useState<ethers.Contract | null>(null);
  const [mneeContract, setMneeContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (!provider) {
      setHubContract(null);
      setOmTokenContract(null);
      setMneeContract(null);
      return;
    }

    const hub = getHubContract(provider);
    const omToken = getOmTokenContract(provider);
    const mnee = getMneeContract(provider);

    if (signer) {
      setHubContract(getHubContract(signer));
      setOmTokenContract(getOmTokenContract(signer));
      setMneeContract(getMneeContract(signer));
    } else {
      setHubContract(hub);
      setOmTokenContract(omToken);
      setMneeContract(mnee);
    }
  }, [provider, signer]);

  return { hubContract, omTokenContract, mneeContract };
}

export function useBalances() {
  const { address, provider } = useWeb3();
  const { omTokenContract, mneeContract } = useContracts();
  const [mneeBalance, setMneeBalance] = useState<string>("0");
  const [omMneeBalance, setOmMneeBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);

  const refreshBalances = useCallback(async () => {
    if (!address || !provider || !omTokenContract || !mneeContract) {
      setMneeBalance("0");
      setOmMneeBalance("0");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [mnee, omMnee] = await Promise.all([
        mneeContract.balanceOf(address),
        omTokenContract.balanceOf(address),
      ]);
      setMneeBalance(ethers.formatEther(mnee));
      setOmMneeBalance(ethers.formatEther(omMnee));
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  }, [address, provider, omTokenContract, mneeContract]);

  useEffect(() => {
    refreshBalances();

    // Poll for balance updates
    const interval = setInterval(refreshBalances, 10000);

    return () => clearInterval(interval);
  }, [refreshBalances]);

  return { mneeBalance, omMneeBalance, loading, refreshBalances };
}

export function useAuthorization() {
  const { address, provider } = useWeb3();
  const { hubContract } = useContracts();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkAuthorization = useCallback(async () => {
    if (!address || !provider || !hubContract) {
      setIsAuthorized(false);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [authorized, owner] = await Promise.all([
        hubContract.authorizedAgents(address),
        hubContract.owner(),
      ]);
      setIsAuthorized(authorized);
      setIsOwner(owner.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error("Error checking authorization:", error);
      setIsAuthorized(false);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  }, [address, provider, hubContract]);

  useEffect(() => {
    checkAuthorization();

    // Poll for authorization updates
    const interval = setInterval(checkAuthorization, 10000);

    return () => clearInterval(interval);
  }, [checkAuthorization]);

  return { isAuthorized, isOwner, loading, checkAuthorization };
}

export function useProtocolStats() {
  const { provider } = useWeb3();
  const { mneeContract, omTokenContract } = useContracts();
  const [totalMneeLocked, setTotalMneeLocked] = useState<string>("0");
  const [totalOmMneeSupply, setTotalOmMneeSupply] = useState<string>("0");
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    if (!provider || !mneeContract || !omTokenContract || !HUB_ADDRESS) {
      setTotalMneeLocked("0");
      setTotalOmMneeSupply("0");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [locked, supply] = await Promise.all([
        mneeContract.balanceOf(HUB_ADDRESS),
        omTokenContract.totalSupply(),
      ]);
      setTotalMneeLocked(ethers.formatEther(locked));
      setTotalOmMneeSupply(ethers.formatEther(supply));
    } catch (error) {
      console.error("Error fetching protocol stats:", error);
    } finally {
      setLoading(false);
    }
  }, [provider, mneeContract, omTokenContract]);

  useEffect(() => {
    refreshStats();

    const interval = setInterval(refreshStats, 30000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  return { totalMneeLocked, totalOmMneeSupply, loading, refreshStats };
}

