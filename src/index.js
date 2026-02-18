import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { disableReactDevTools } from "@fvilers/disable-react-devtools";

import { LanguageProvider } from './contexts/LanguageContext';
import { AuthUserProvider } from "./contexts/AuthUserContext";

// Disable ReactDevTools based on the environment
if (process.env.NODE_ENV === "production") disableReactDevTools();

// Disable console.log in production
if (process.env.NODE_ENV !== "development") {
  console.log = () => { };
  console.debug = () => { };
  console.info = () => { };
  console.warn = () => { };
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AuthUserProvider>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </AuthUserProvider>
);