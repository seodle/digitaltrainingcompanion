import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Admin from "./scenes/admin";
import Dashboard from "./scenes/dashboard";
import Dashboard2 from "./scenes/old/dashboard2";
import Tutorial from "./scenes/tutorial";
import Signup from "./scenes/signup";
import Signin from "./scenes/signin";
import CreateSurvey from "./scenes/createSurvey";
import PreviewSurvey from "./scenes/previewSurvey";
import CompleteSurvey from "./scenes/completeSurvey";
import Reports from "./scenes/reports";
import Logbooks from "./scenes/logbooks";
import Reporting from "./scenes/reporting";
import Frameworks from "./scenes/frameworks";
import Model from "./scenes/models";
import Home from "./scenes/home";
import UpdatePassword from "./scenes/updatePassword";
import ResetPassword from "./scenes/resetPassword";
import Settings from "./scenes/settings";
import VerifyEmail from "./scenes/verifyEmail";
import EndSurvey from "./scenes/endSurvey";
import Embedder from "./scenes/embedder";
import PrivateRoute from "./components/PrivateRoute";
import QuestionWidget from "./components/QuestionWidget";
// Compute admin emails locally from environment (build-time)
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

function RootLayout() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Outlet />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/signup", element: <Signup /> },
      { path: "/signin", element: <Signin /> },

      { path: "/resetPassword", element: <ResetPassword /> },
      { path: "/updatePassword/:token", element: <UpdatePassword /> },

      { path: "/verifyEmail/", element: <VerifyEmail /> },
      { path: "/completeSurvey", element: <CompleteSurvey /> },
      { path: "/endSurvey", element: <EndSurvey /> },
      {
        path: "/reporting",
        element: (
          <PrivateRoute>
            <Reporting />
          </PrivateRoute>
        ),
      },
      { path: "/embed/question/:questionId", element: <QuestionWidget /> },

      {
        path: "/settings/",
        element: (
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        ),
      },

      {
        path: "/embedder/",
        element: (
          <PrivateRoute authorizedEmails={ADMIN_EMAILS}>
            <Embedder />
          </PrivateRoute>
        ),
      },
      {
        path: "/admin/",
        element: (
          <PrivateRoute authorizedEmails={ADMIN_EMAILS}>
            <Admin />
          </PrivateRoute>
        ),
      },
      {
        path: "/createSurvey",
        element: (
          <PrivateRoute>
            <CreateSurvey />
          </PrivateRoute>
        ),
      },

      {
        path: "/previewSurvey",
        element: (
          <PrivateRoute>
            <PreviewSurvey />
          </PrivateRoute>
        ),
      },
      {
        path: "/reports",
        element: (
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        ),
      },
      {
        path: "/logbooks",
        element: (
          <PrivateRoute>
            <Logbooks />
          </PrivateRoute>
        ),
      },

      {
        path: "/dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },

      {
        path: "/dashboard2",
        element: (
          <PrivateRoute>
            <Dashboard2 />
          </PrivateRoute>
        ),
      },

      {
        path: "/model",
        element: (
          <PrivateRoute>
            <Model />
          </PrivateRoute>
        ),
      },
      {
        path: "/frameworks",
        element: (
          <PrivateRoute>
            <Frameworks />
          </PrivateRoute>
        ),
      },
      {
        path: "/tutorial",
        element: (
          <PrivateRoute>
            <Tutorial />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
