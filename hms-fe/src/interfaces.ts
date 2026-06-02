export interface CartItem {
  roomCategoryUuid: string
  roomCategoryName: string
  hotelName: string
  checkInDate?: Date
  checkOutDate?: Date
  guestName?: string
  guestEmail?: string
  specialRequests?: string | null
}
