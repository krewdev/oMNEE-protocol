import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { DepositPage } from "./pages/DepositPage";
import { TransferPage } from "./pages/TransferPage";
import { RedeemPage } from "./pages/RedeemPage";
import { TeleportPage } from "./pages/TeleportPage";
import { AdminPage } from "./pages/AdminPage";
import { HistoryPage } from "./pages/HistoryPage";

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/teleport" element={<TeleportPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;

