import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./globals.css";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./components/auth/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
