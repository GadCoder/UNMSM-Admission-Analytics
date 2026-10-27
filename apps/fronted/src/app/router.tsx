import { createBrowserRouter, ScrollRestoration } from "react-router-dom";

import { App } from "./App";
import { DashboardPage } from "../pages/DashboardPage";
import { ResultsPage } from "../pages/ResultsPage/ResultsPage";
import { CareerExplorerPage } from "../features/analytics/pages/CareerExplorerPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <><App /><ScrollRestoration /></>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "resultados", element: <ResultsPage /> },
      { path: "carreras/:majorId?", element: <CareerExplorerPage /> },
    ],
  },
]);
