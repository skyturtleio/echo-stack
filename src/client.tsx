import { StartClient } from "@tanstack/react-start"
import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import { createRouter } from "./router"

/**
 * Custom Client Entry Point
 *
 * This hydrates the client-side application after server-side rendering.
 * Configuration validation happens on the server side during startup.
 */

const router = createRouter()

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
)
