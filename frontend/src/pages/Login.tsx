import { useState } from "react"; // 1. 引入 useState
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
// 引入一個警示圖示 (選用)
import { AlertCircle } from "lucide-react"; 

function LoginPage() {
  const navigate = useNavigate();

  // 2. 設定狀態來儲存使用者輸入的內容
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // 用來存錯誤訊息

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 3. 清除之前的錯誤訊息
    setErrorMessage("");

    // 4. 前端模擬驗證邏輯 (Hardcoded Check)
    if (account === "test" && password === "test") {
      console.log("登入成功！");
      navigate("/dashboard");
    } else {
      // 驗證失敗，顯示錯誤訊息
      setErrorMessage("帳號或密碼錯誤，請再試一次");
      // 也可以在這裡順便把密碼欄位清空
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">歡迎回來！</CardTitle>
          <CardDescription className="text-center">
            請輸入帳號密碼以登入記帳本。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* 5. 錯誤訊息顯示區 */}
            {errorMessage && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="account">帳號</Label>
              <Input 
                id="account"
                placeholder="account" 
                required 
                // 6. 綁定數值 (雙向綁定)
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="password"
                required
                // 6. 綁定數值
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
              登入
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;