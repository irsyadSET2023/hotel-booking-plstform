import { useQuery } from '@tanstack/react-query'
import { getRoomCategories } from '../_services/get-room-categories'

export function useRoomCategories({
  search,
  page,
  pageSize,
  roomCategory,
  checkInDate,
  checkOutDate,
}: {
  search?: string
  page: number
  pageSize: number
  roomCategory?: string
  checkInDate: string
  checkOutDate: string
}) {
  return useQuery({
    queryKey: [
      'room-categories',
      search,
      page,
      pageSize,
      roomCategory,
      checkInDate,
      checkOutDate,
    ],
    queryFn: () =>
      getRoomCategories({
        search,
        page,
        pageSize,
        roomCategory,
        checkInDate,
        checkOutDate,
      }),
  })
}
