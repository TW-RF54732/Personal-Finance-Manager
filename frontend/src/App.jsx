import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// 引入分頁
import Dashboard from "@/pages/Dashboard"
import DataLibrary from "@/pages/DataLibrary"
import Analytics from "@/pages/Analytics"

export default function App() {
  return (
    <Router>
      <SidebarProvider
        defaultOpen={true}
        style={{
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
            <Route path="/analytics" element={<Analytics />} />
          </Routes>

        </SidebarInset>
      </SidebarProvider>
    </Router>
  )
}