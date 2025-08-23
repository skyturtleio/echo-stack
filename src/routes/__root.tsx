import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import Header from "../components/Header"
import { CriticalErrorBoundary } from "../components/ErrorBoundary"

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools"

import appCss from "../styles.css?url"

import type { QueryClient } from "@tanstack/react-query"
import type { AuthContext } from "~/lib/auth-context"

import { PROJECT_CONFIG } from "~/lib/project-config"

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
        title: `${PROJECT_CONFIG.name} - ${PROJECT_CONFIG.tagline}`,
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
