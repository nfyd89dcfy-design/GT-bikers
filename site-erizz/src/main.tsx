import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { startBoot } from "./lib/boot";

startBoot();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
