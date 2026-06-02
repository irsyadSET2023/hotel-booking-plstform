import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hotel/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <h1>Hotel</h1>
}
