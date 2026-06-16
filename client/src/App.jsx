import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./layouts/Sidebar";
import Navbar from "./layouts/Navbar";
import Maintenance from "./pages/Maintenance";
import AccountSettings from "./pages/AccountSettings";
import Login from "./pages/Login";
import RoleManagement from "./pages/RoleManagement";
import AccessControl from "./pages/AccessControl";
import ProductDistribution from "./pages/ProductDistribution";
// ✅ IMPORT NEW LOCATION PAGES
import StateManagement from "./pages/StateManagement";
import DistrictManagement from "./pages/DistrictManagement";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("loggedInUser") !== null;
  });

  const getLoggedInRole = () => {
    try {
      const userStr = localStorage.getItem("loggedInUser");
      if (!userStr) return "";
      const user = JSON.parse(userStr);
      return (user.role || user.UserSignUpRole || "").toLowerCase();
    } catch {
      return "";
    }
  };

  const styles = {
    appContainer: {
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "#f5f5f9",
      fontFamily: '"Public Sans", sans-serif',
      color: "#697a8d",
    },
    mainContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      minWidth: 0,
    },
    contentArea: {
      padding: "0 24px 24px 24px",
      overflowY: "auto",
      overflowX: "hidden",
      flex: 1,
      minWidth: 0,
    },
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login onLogin={() => setIsAuthenticated(true)} />}
        />

        <Route
          path="*"
          element={
            isAuthenticated ? (
              <div style={styles.appContainer}>
                <Sidebar />
                <div style={styles.mainContent}>
                  <Navbar />
                  <div style={styles.contentArea}>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <Navigate to="/account-settings/account" replace />
                        }
                      />

                      <Route
                        path="/product-distribution"
                        element={
                          getLoggedInRole() === "national ngo" ? (
                            <Navigate to="/account-settings/account" replace />
                          ) : (
                            <ProductDistribution />
                          )
                        }
                      />

                      <Route
                        path="/account-settings/account"
                        element={<AccountSettings />}
                      />
                      <Route
                        path="/settings/role-management"
                        element={<RoleManagement />}
                      />

                      {/* ✅ FIXED: Renamed to match the sidebar Link */}
                      <Route
                        path="/settings/access-management"
                        element={<AccessControl />}
                      />

                      {/* ✅ NEW: Location Management Routes */}
                      <Route
                        path="/settings/states"
                        element={<StateManagement />}
                      />
                      <Route
                        path="/settings/districts"
                        element={<DistrictManagement />}
                      />

                      <Route
                        path="*"
                        element={<Maintenance pageName="404 Not Found" />}
                      />
                    </Routes>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
