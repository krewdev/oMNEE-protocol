import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { DepositPage } from "./pages/DepositPage";
import { RedeemPage } from "./pages/RedeemPage";
import { TransferPage } from "./pages/TransferPage";
import { TeleportPage } from "./pages/TeleportPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AdminPage } from "./pages/AdminPage";
import { FaucetPage } from "./pages/FaucetPage";
import { WalletCreatorPage } from "./pages/WalletCreatorPage";
import { EmailWalletPage } from "./pages/EmailWalletPage";

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/teleport" element={<TeleportPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/faucet" element={<FaucetPage />} />
            <Route path="/create-wallet" element={<WalletCreatorPage />} />
            <Route path="/email-wallet" element={<EmailWalletPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;
