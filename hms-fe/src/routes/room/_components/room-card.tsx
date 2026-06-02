import { Button } from '#/components/ui/button'
import useCartStore from '#/store/room/cart-store'

interface RoomCardProps {
  room: {
    uuid: string
    name: string
    basePrice: string
    maxOccupancy: number
    hotel: {
      name: string
    }
    availability: {
      availableRooms: number
    }
  }
  checkInDate: string
  checkOutDate: string
}

export function RoomCard({ room, checkInDate, checkOutDate }: RoomCardProps) {
  const { cartItems, addToCart, removeFromCart } = useCartStore()

  const isInCart = cartItems.some((item) => item.roomCategoryUuid === room.uuid)

  const handleToggleCart = () => {
    if (isInCart) {
      removeFromCart(room.uuid)
    } else {
      addToCart({
        roomCategoryUuid: room.uuid,
        roomCategoryName: room.name,
        hotelName: room.hotel.name,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
      })
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between">
        <h3 className="font-semibold">{room.name}</h3>
        <span className="font-medium">${room.basePrice}</span>
      </div>

      <p className="text-sm text-gray-500">Hotel: {room.hotel.name}</p>

      <p className="text-sm">Max occupancy: {room.maxOccupancy}</p>

      <p className="text-sm text-green-600">
        Available: {room.availability.availableRooms}
      </p>

      <Button
        className="w-full"
        variant={isInCart ? 'outline' : 'default'}
        disabled={!isInCart && room.availability.availableRooms === 0}
        onClick={handleToggleCart}
      >
        {isInCart ? 'Remove from Cart' : 'Add to Cart'}
      </Button>
    </div>
  )
}
