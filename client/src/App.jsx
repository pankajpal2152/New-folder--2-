// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./layouts/Sidebar";
import Navbar from "./layouts/Navbar";
import Maintenance from "./pages/Maintenance";
import AccountSettings from "./pages/AccountSettings";
import Login from "./pages/Login";
import RoleManagement from "./pages/RoleManagement";
import AccessControl from "./pages/AccessControl";
// ✅ ADDED THIS IMPORT TO FIX THE ERROR
import ProductDistribution from "./pages/ProductDistribution";

const App = () => {
  // FIX: Initialize state by checking localStorage directly.
  // This ensures that if they refresh, it remembers they are logged in!
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
        {/* LOGIN ROUTE */}
        <Route
          path="/login"
          element={<Login onLogin={() => setIsAuthenticated(true)} />}
        />

        {/* PROTECTED ROUTES (Only accessible if logged in) */}
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
                      {/* Redirect Root directly to Account Settings */}
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
                        path="/layouts"
                        element={<Maintenance pageName="Layouts" />}
                      />
                      <Route
                        path="/account-settings/account"
                        element={<AccountSettings />}
                      />
                      <Route
                        path="/settings/role-management"
                        element={<RoleManagement />}
                      />
                      <Route
                        path="/settings/access-control"
                        element={<AccessControl />}
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
              /* IF NOT LOGGED IN, KICK THEM TO LOGIN PAGE */
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
