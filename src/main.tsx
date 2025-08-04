import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./globals.css";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./components/auth/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
