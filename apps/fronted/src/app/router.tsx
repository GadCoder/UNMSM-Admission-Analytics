import { createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import { DashboardPage } from "../pages/DashboardPage/DashboardPage";
import { ResultsPage } from "../pages/ResultsPage/ResultsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "resultados", element: <ResultsPage /> },
    ],
  },
]);
