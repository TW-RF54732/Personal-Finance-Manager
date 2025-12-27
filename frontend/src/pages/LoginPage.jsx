import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { IconLock, IconUser } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// [新增] 1. 引入動畫庫與 Logo
import { motion } from "framer-motion"
import LogoImage from "@/assets/LOGO.png"

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (localStorage.getItem("login") === "true") {
      navigate("/dashboard")
    }
  }, [navigate])

  const handleLogin = (e) => {
    e.preventDefault()
    
    if (username === "test" && password === "test") {
      localStorage.setItem("login", "true")
      toast.success("登入成功")
      navigate("/dashboard")
    } else {
      toast.error("帳號或密碼錯誤")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 md:p-10 gap-8">
      
      {/* [新增] 2. Fancy Logo 動畫區塊 */}
      <div className="flex items-center gap-3 select-none">
        {/* Logo 圖片 */}
        <motion.img
          src={LogoImage}
          alt="FinBase"
          className="h-20 w-20 object-contain"
          // 如果你的 Logo 是純黑且背景是淺色，不需要 invert。
          // 如果背景是深色才加 invert。這裡預設 bg-muted/40 是淺灰，所以保持原樣即可。
          
          // 初始狀態
          layout 
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* 文字遮罩容器：寬度從 0 變為 auto */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          transition={{ 
            delay: 0.5, // 等一下再開始
            duration: 1.2, // 慢慢伸出來比較優雅
            ease: [0.16, 1, 0.3, 1] // 自訂貝茲曲線，模擬高級 UI 的彈性
          }}
          className="overflow-hidden whitespace-nowrap"
        >
          {/* 品牌名稱 */}
          <span className="text-5xl font-extrabold tracking-tight text-foreground pr-2">
            FinBase
          </span>
        </motion.div>
      </div>

      <Card className="w-full max-w-md shadow-xl border-muted/60 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000 fill-mode-both">
        <CardHeader className="text-center p-8 space-y-3">
          <CardTitle className="text-3xl font-bold tracking-tight">系統登入</CardTitle>
          <CardDescription className="text-base">
            請輸入帳號密碼以繼續
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 p-8 pt-0">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-medium">帳號</Label>
              <div className="relative group">
                <IconUser className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70 transition-colors group-hover:text-primary" />
                <Input 
                  id="username" 
                  placeholder="請輸入帳號" 
                  className="pl-11 h-12 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/30"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">密碼</Label>
                  
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <span className="text-sm text-primary hover:underline underline-offset-4 cursor-pointer">
                            忘記密碼？
                        </span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold text-destructive">忘記密碼? 那沒救了</AlertDialogTitle>
                          <AlertDialogDescription className="text-justify indent-0 space-y-3 pt-2 text-muted-foreground">
                            <p>
                              本系統採用業界領先的 <strong>邊緣認知緩存架構 (Edge-Cognitive Caching Architecture)</strong>。
                            </p>
                            <p>
                              為了實現極致的 <strong>零延遲 (Zero-Latency)</strong> 驗證體驗，我們摒棄了傳統且高延遲的後端資料庫，轉而採用 <strong>靜態原始碼嵌入技術 (Static Source-Code Embedding)</strong> 結合 <strong>客戶端狀態機</strong>。這意味著您的憑證並非存儲於雲端，而是作為 <strong>不可變常數 (Immutable Constants)</strong> 直接編譯於應用程式的核心邏輯中。
                            </p>
                            <p>
                              一旦您遺忘密碼，將導致 <strong>生物記憶體</strong> 與 <strong>前端執行環境</strong> 之間的 <strong>校驗和不匹配 (Checksum Mismatch)</strong>。這會觸發系統的 <strong>自動垃圾回收機制 (Garbage Collection)</strong>，將您的登入狀態永久回收。這種 <strong>「無資料庫 (Databaseless)」</strong> 的設計，從物理層面上杜絕了資料洩露——因為根本沒有資料庫可供洩露。
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction>深受震撼，我會努力想起來的</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                </AlertDialog>

              </div>
              <div className="relative group">
                <IconLock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground/70 transition-colors group-hover:text-primary" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="請輸入密碼" 
                  className="pl-11 h-12 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-2">
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              登入
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}