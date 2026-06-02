export interface RoomCategory {
  uuid: string
  name: string
  basePrice: string
  maxOccupancy: number
  hotel: {
    uuid: string
    name: string
  }
  availability: {
    totalRooms: number
    reservedRooms: number
    blockedRooms: number
    availableRooms: number
  }
}

export interface RoomCategoryResponse {
  data: RoomCategory[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RoomSearch {
  search?: string
  page: number
  pageSize: number
  roomCategory?: string
}
