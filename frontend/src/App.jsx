// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider } from './context/AuthContext';
// import ProtectedRoute from './components/ProtectedRoute';
// import AppLayout from './components/layout/AppLayout';

// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Dealers from './pages/Dealers';
// import DealerDetail from './pages/DealerDetail';
// import Products from './pages/Products';
// import Inventory from './pages/Inventory';
// import Sales from './pages/Sales';
// import NewSale from './pages/NewSale';
// import SaleDetail from './pages/SaleDetail';
// import Purchases from './pages/Purchases';
// import Payments from './pages/Payments';
// import Reports from './pages/Reports';
// import Salesmen from './pages/Salesmen';
// import Notifications from './pages/Notifications';
// import Settings from './pages/Settings';

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Toaster
//           position="top-right"
//           toastOptions={{
//             duration: 3200,
//             style: {
//               borderRadius: '14px',
//               fontSize: '14px',
//               fontWeight: 500,
//               padding: '12px 16px',
//               boxShadow: '0 8px 30px -8px rgba(11,19,48,0.25), 0 0 0 1px rgba(20,176,162,0.12)',
//               background: 'rgba(255,255,255,0.98)',
//               backdropFilter: 'blur(8px)',
//             },
//             success: { iconTheme: { primary: '#0E8E83', secondary: '#fff' } },
//             error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
//           }}
//         />
//         <Routes>
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />

//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <AppLayout />
//               </ProtectedRoute>
//             }
//           >
//             <Route index element={<Dashboard />} />
//             <Route path="dealers" element={<Dealers />} />
//             <Route path="dealers/:id" element={<DealerDetail />} />
//             <Route path="products" element={<Products />} />
//             <Route path="inventory" element={<Inventory />} />
//             <Route path="sales" element={<Sales />} />
//             <Route path="sales/new" element={<NewSale />} />
//             <Route path="sales/:id" element={<SaleDetail />} />
//             <Route path="purchases" element={<Purchases />} />
//             <Route path="payments" element={<Payments />} />
//             <Route path="reports" element={<Reports />} />
//             <Route path="salesmen" element={<Salesmen />} />
//             <Route path="notifications" element={<Notifications />} />
//             <Route path="settings" element={<Settings />} />
//           </Route>
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }








import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { BYPASS_AUTH } from './lib/config';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Dealers from './pages/Dealers';
import DealerDetail from './pages/DealerDetail';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import NewSale from './pages/NewSale';
import SaleDetail from './pages/SaleDetail';
import Purchases from './pages/Purchases';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Salesmen from './pages/Salesmen';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            style: {
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 16px',
              boxShadow: '0 8px 30px -8px rgba(11,19,48,0.25), 0 0 0 1px rgba(20,176,162,0.12)',
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(8px)',
            },
            success: { iconTheme: { primary: '#0E8E83', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* While bypass mode is on, /login and /register just bounce back
              to "/" instead of showing the form — this is what fixes the
              case where someone lands directly on /login. */}
          <Route path="/login" element={BYPASS_AUTH ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={BYPASS_AUTH ? <Navigate to="/" replace /> : <Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dealers" element={<Dealers />} />
            <Route path="dealers/:id" element={<DealerDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/new" element={<NewSale />} />
            <Route path="sales/:id" element={<SaleDetail />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="salesmen" element={<Salesmen />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}