export interface CartItem {
  roomCategoryUuid: bigint
  roomCategoryName: string
  hotelName: string
  checkInDate?: Date
  checkOutDate?: Date
  guestName?: string
  guestEmail?: string
  specialRequests?: string | null
}
