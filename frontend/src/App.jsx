import { useEffect, useState } from "react"
// [重要] 請確保你有安裝 react-router-dom，如果之前沒裝，請執行 npm install react-router-dom
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// 引入分頁
import Dashboard from "@/pages/Dashboard"
import DataLibrary from "@/pages/DataLibrary"

export default function App() {
  return (
    <Router>
      <SidebarProvider
        defaultOpen={true}
        style={{
          // [修改] 將原本的 72 改為 16rem (或是 15rem)，這樣會更緊湊，剛好容納 user@example.com
          "--sidebar-width": "13rem", 
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar />
        
        <SidebarInset>
          {/* Header 放在這裡，所有頁面共用 */}
          <SiteHeader />
          
          {/* 這裡決定要顯示哪個頁面 */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<DataLibrary />} />
          </Routes>

        </SidebarInset>
      </SidebarProvider>
    </Router>
  )
}