import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import { Routes, Route } from "react-router-dom";
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

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />

          <Route path="/resetPassword" element={<ResetPassword />} />
          <Route path="/updatePassword/:token" element={<UpdatePassword />} />

          <Route path="/verifyEmail/" element={<VerifyEmail />} />
          <Route path="/completeSurvey" element={<CompleteSurvey />} />
          <Route path="/endSurvey" element={<EndSurvey />} />
          <Route
            path="/reporting"
            element={
              <PrivateRoute>
                <Reporting />
              </PrivateRoute>
            }
          />
          <Route path="/embed/question/:questionId" element={<QuestionWidget />} />

          <Route
            path="/settings/"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />

          <Route
            path="/embedder/"
            element={
              <PrivateRoute authorizedEmails={ADMIN_EMAILS}>
                <Embedder />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/"
            element={
              <PrivateRoute authorizedEmails={ADMIN_EMAILS}>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route path="/createSurvey"
            element={
              <PrivateRoute>
                <CreateSurvey />
              </PrivateRoute>
            }
          />

          <Route
            path="/previewSurvey"
            element={
              <PrivateRoute>
                <PreviewSurvey />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/logbooks"
            element={
              <PrivateRoute>
                <Logbooks />
              </PrivateRoute>
            }
          />

          <Route
            path="/previewSurvey"
            element={
              <PrivateRoute>
                <PreviewSurvey />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/logbooks"
            element={
              <PrivateRoute>
                <Logbooks />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard2"
            element={
              <PrivateRoute>
                <Dashboard2 />
              </PrivateRoute>
            }
          />

          <Route path="/model" element={
            <PrivateRoute>
              <Model />
            </PrivateRoute>
          } />
          <Route path="/frameworks" element={
            <PrivateRoute>
              <Frameworks />
            </PrivateRoute>
          } />
          <Route path="/tutorial" element={
            <PrivateRoute>
              <Tutorial />
            </PrivateRoute>
          } />

          <Route
            path="/createSurvey"
            element={
              <PrivateRoute>
                <CreateSurvey />
              </PrivateRoute>
            }
          />
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;