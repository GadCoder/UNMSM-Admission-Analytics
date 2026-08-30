import { createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import { DashboardPage } from "../pages/DashboardPage";
import { ResultsPage } from "../pages/ResultsPage/ResultsPage";
import { MajorDetailPage } from "../features/analytics/pages/MajorDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "resultados", element: <ResultsPage /> },
      { path: "analytics/careers/:majorId", element: <MajorDetailPage /> },
    ],
  },
]);
