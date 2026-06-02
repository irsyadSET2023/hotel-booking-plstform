import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { RoomPage } from './_components/room-page'

const today = new Date().toISOString().split('T')[0]!
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]!

export const Route = createFileRoute('/room/')({
  validateSearch: z.object({
    search: z.string().optional(),
    page: z.number().catch(1),
    pageSize: z.number().catch(10),
    roomCategory: z.string().optional(),
    checkInDate: z.string().catch(today),
    checkOutDate: z.string().catch(tomorrow),
  }),
  component: RoomPage,
})
