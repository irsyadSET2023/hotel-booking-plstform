import type { CartItem } from '#/interfaces'
import { create } from 'zustand'

interface CartStore {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
}

const useCartStore = create<CartStore>((set) => ({
  cartItems: [] as CartItem[],
  addToCart: (item: CartItem) =>
    set((state) => ({
      cartItems: [...state.cartItems, item],
    })),
  removeFromCart: (itemId: string) =>
    set((state) => ({
      cartItems: state.cartItems.filter(
        (item) => item.roomCategoryUuid !== itemId,
      ),
    })),
  clearCart: () => set({ cartItems: [] }),
}))

export default useCartStore
