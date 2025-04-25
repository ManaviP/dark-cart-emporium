import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/context/auth-context";

// Page imports
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import Loading from "./components/shared/Loading";

// Lazy-loaded routes for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProductsList = lazy(() => import("./pages/ProductsList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/profile/UserProfile"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AuthCallback = lazy(() => import("./pages/auth/Callback"));
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard"));
const SellerProducts = lazy(() => import("./pages/seller/Products"));
const SellerAddProduct = lazy(() => import("./pages/seller/AddProduct"));
const SellerEditProduct = lazy(() => import("./pages/seller/EditProduct"));
const SellerDonateProduct = lazy(() => import("./pages/seller/DonateProduct"));
const DonateProduct = lazy(() => import("./components/seller/DonateProduct"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const ProductTracking = lazy(() => import("./pages/seller/ProductTracking"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminDonations = lazy(() => import("./pages/admin/Donations"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminSecurity = lazy(() => import("./pages/admin/Security"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const LogisticsDashboard = lazy(() => import("./pages/logistics/Dashboard"));
const LogisticsOrders = lazy(() => import("./pages/logistics/Orders"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" forcedTheme="dark">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Main Layout Routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<ProductsList />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/edit" element={<UserProfile />} />

                  {/* Seller Routes */}
                  <Route path="seller">
                    <Route index element={<SellerDashboard />} />
                    <Route path="products" element={<SellerProducts />} />
                    <Route path="products/add" element={<SellerAddProduct />} />
                    <Route path="products/edit/:id" element={<SellerEditProduct />} />
                    <Route path="products/donate/:id" element={<SellerDonateProduct />} />
                    <Route path="products/donate" element={<DonateProduct />} />
                    <Route path="orders" element={<SellerOrders />} />
                    <Route path="tracking" element={<ProductTracking />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="admin">
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="donations" element={<AdminDonations />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="security" element={<AdminSecurity />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="content" element={<AdminContent />} />
                    <Route path="reports" element={<AdminReports />} />
                  </Route>

                  {/* Logistics Routes */}
                  <Route path="logistics">
                    <Route index element={<LogisticsDashboard />} />
                    <Route path="orders" element={<LogisticsOrders />} />
                  </Route>
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
