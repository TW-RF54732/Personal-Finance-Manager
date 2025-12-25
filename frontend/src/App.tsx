import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 路徑為 / 時，顯示登入頁 */}
        <Route path="/" element={<Login />} />
        
        {/* 路徑為 /dashboard 時，顯示主頁 */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 如果使用者亂打網址，全部導回登入頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;