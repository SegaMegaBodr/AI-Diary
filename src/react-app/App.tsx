import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import HomePage from "@/react-app/pages/Home";
import QuestionsPage from "@/react-app/pages/Questions";
import PracticesPage from "@/react-app/pages/Practices";
import TimelinePage from "@/react-app/pages/Timeline";
import SettingsPage from "@/react-app/pages/Settings";
import TodosPage from "@/react-app/pages/Todos";
import PomodoroPage from "@/react-app/pages/Pomodoro";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/practices" element={<PracticesPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
