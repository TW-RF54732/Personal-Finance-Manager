import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

// 引入分頁
import Dashboard from "@/pages/Dashboard"
import DataLibrary from "@/pages/DataLibrary"
import Analytics from "@/pages/Analytics"
import Settings from "@/pages/Settings"
import LoginPage from "@/pages/LoginPage" // [新增]

// 1. 建立 Layout 組件：負責渲染 Sidebar 和 Header
const MainLayout = () => {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{
        "--sidebar-width": "13rem", 
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        {/* Outlet 代表子路由的內容 (Dashboard, Analytics 等) */}
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}

// 2. 建立路由守衛 (Protected Route)
const ProtectedRoute = () => {
  const isAuth = localStorage.getItem("login") === "true"
  return isAuth ? <MainLayout /> : <Navigate to="/login" replace />
}

// 3. 根路由處理 (Root Redirect)
const RootRedirect = () => {
  const isAuth = localStorage.getItem("login") === "true"
  return isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 登入頁面 (沒有 Sidebar) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 根路徑：負責跳轉 */}
        <Route path="/" element={<RootRedirect />} />

        {/* 受保護的路由區塊 (都套用 MainLayout) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<DataLibrary />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* 捕捉未定義路由，導回根目錄 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  )
}