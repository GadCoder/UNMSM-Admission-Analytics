import { createBrowserRouter, ScrollRestoration } from "react-router-dom";

import { App } from "./App";
import { DashboardPage } from "../pages/DashboardPage";
import { ResultsPage } from "../pages/ResultsPage/ResultsPage";
import { CareerExplorerPage } from "../features/analytics/pages/CareerExplorerPage";
import { CareerComparisonPage } from "../features/analytics/pages/CareerComparisonPage";
import { NotFoundPage, RouteErrorPage } from "./RouteErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <App />
        <ScrollRestoration />
      </>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "results", element: <ResultsPage /> },
      { path: "majors/:majorId?", element: <CareerExplorerPage /> },
      { path: "compare-majors", element: <CareerComparisonPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
