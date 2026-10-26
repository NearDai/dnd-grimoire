import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initFx } from "./lib/fx";
import "./styles/textures.css";
import "./styles/global.css";
import "./styles/page.css";

initFx();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* basename ตาม base ของ Vite: dev = "/", GitHub Pages = "/dnd-grimoire/" */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
