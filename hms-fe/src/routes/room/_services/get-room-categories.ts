import axios from '#/lib/axios'

export async function getRoomCategories({
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
  const { data } = await axios.get('api/rooms/categories', {
    params: {
      checkInDate,
      checkOutDate,
      search,
      roomCategory,
      page,
      limit: pageSize,
    },
  })

  return data.data
}
