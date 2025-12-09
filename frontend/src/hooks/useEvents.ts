import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { getHubContract, getOmTokenContract } from "../utils/contracts";
import { HUB_ADDRESS, OM_TOKEN_ADDRESS } from "../utils/constants";

export interface CollateralLockedEvent {
  type: "CollateralLocked";
  agent: string;
  amount: string;
  purpose: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface RedemptionRequestedEvent {
  type: "RedemptionRequested";
  agent: string;
  amount: string;
  destination: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface OmniTransferEvent {
  type: "OmniTransfer";
  from: string;
  to: string;
  value: string;
  metadata: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export interface AgentAuthorizedEvent {
  type: "AgentAuthorized";
  agent: string;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}

export type ProtocolEvent =
  | CollateralLockedEvent
  | RedemptionRequestedEvent
  | OmniTransferEvent
  | AgentAuthorizedEvent;

export function useEvents(limit: number = 50) {
  const { provider } = useWeb3();
  const [events, setEvents] = useState<ProtocolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!provider || !HUB_ADDRESS || !OM_TOKEN_ADDRESS) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const hubContract = getHubContract(provider);
      const omTokenContract = getOmTokenContract(provider);

      // Fetch events from last 10000 blocks (adjust as needed)
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      const [collateralEvents, redemptionEvents, transferEvents, authEvents] = await Promise.all([
        hubContract.queryFilter(hubContract.filters.CollateralLocked(), fromBlock),
        hubContract.queryFilter(hubContract.filters.RedemptionRequested(), fromBlock),
        omTokenContract.queryFilter(omTokenContract.filters.OmniTransfer(), fromBlock),
        hubContract.queryFilter(hubContract.filters.AgentAuthorized(), fromBlock),
      ]);

      const allEvents: ProtocolEvent[] = [];

      // Process CollateralLocked events
      for (const event of collateralEvents) {
        if (event instanceof ethers.EventLog) {
          const block = await provider.getBlock(event.blockNumber);
          allEvents.push({
            type: "CollateralLocked",
            agent: event.args[0] as string,
            amount: ethers.formatEther(event.args[1] as bigint),
            purpose: event.args[2] as string,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: block?.timestamp,
          });
        }
      }

      // Process RedemptionRequested events
      for (const event of redemptionEvents) {
        if (event instanceof ethers.EventLog) {
          const block = await provider.getBlock(event.blockNumber);
          allEvents.push({
            type: "RedemptionRequested",
            agent: event.args[0] as string,
            amount: ethers.formatEther(event.args[1] as bigint),
            destination: event.args[2] as string,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: block?.timestamp,
          });
        }
      }

      // Process OmniTransfer events
      for (const event of transferEvents) {
        if (event instanceof ethers.EventLog) {
          const block = await provider.getBlock(event.blockNumber);
          allEvents.push({
            type: "OmniTransfer",
            from: event.args[0] as string,
            to: event.args[1] as string,
            value: ethers.formatEther(event.args[2] as bigint),
            metadata: event.args[3] as string,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: block?.timestamp,
          });
        }
      }

      // Process AgentAuthorized events
      for (const event of authEvents) {
        if (event instanceof ethers.EventLog) {
          const block = await provider.getBlock(event.blockNumber);
          allEvents.push({
            type: "AgentAuthorized",
            agent: event.args[0] as string,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: block?.timestamp,
          });
        }
      }

      // Sort by block number (newest first) and limit
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setEvents(allEvents.slice(0, limit));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [provider, limit]);

  useEffect(() => {
    fetchEvents();

    // Refresh events every 30 seconds
    const interval = setInterval(fetchEvents, 30000);

    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, loading, refresh: fetchEvents };
}

