import { Navigate, Route, Routes } from "react-router-dom";
import DiceDrawer from "./components/DiceDrawer";
import Masthead from "./components/Masthead";
import CreatePage from "./pages/create/CreatePage";
import RosterPage from "./pages/RosterPage";
import RulesPage from "./pages/RulesPage";

export default function App() {
  return (
    <>
      <Masthead />
      <Routes>
        <Route path="/" element={<RosterPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DiceDrawer />
    </>
  );
}
