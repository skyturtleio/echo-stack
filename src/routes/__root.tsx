import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { useEffect } from "react"

import Header from "../components/Header"
import {
  CriticalErrorBoundary,
  setupGlobalErrorHandlers,
} from "../components/ErrorBoundary"

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"

import appCss from "../styles.css?url"

import type { QueryClient } from "@tanstack/react-query"
import type { AuthContext } from "~/lib/auth-context"

interface MyRouterContext {
  queryClient: QueryClient
  auth?: AuthContext
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // Config validation is handled server-side in server.ts - removed from client
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Echo Stack - Single-Seat Full-Stack Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: () => <div>Not Found</div>,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup global error handlers on mount
    setupGlobalErrorHandlers()
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <CriticalErrorBoundary>
          <Header />
          {children}
          <TanStackDevtools
            config={{
              position: "bottom-left",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </CriticalErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}
