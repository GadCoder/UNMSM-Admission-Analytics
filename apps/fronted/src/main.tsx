import ReactDOM from "react-dom/client";

import { AppRouter, AppProviders } from "./app/providers";
import "./shared/styles/tokens.css";
import "./shared/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <AppRouter />
  </AppProviders>,
);
