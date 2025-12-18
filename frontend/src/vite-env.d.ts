/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUB_ADDRESS?: string;
  readonly VITE_OM_TOKEN_ADDRESS?: string;
  readonly VITE_FAUCET_ADDRESS?: string;
  readonly VITE_MNEE_ADDRESS?: string;
  readonly VITE_RPC_URL?: string;
  readonly VITE_BLUE_TEAM_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}










