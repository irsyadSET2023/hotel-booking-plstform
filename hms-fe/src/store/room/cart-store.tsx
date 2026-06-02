import type { CartItem } from '#/interfaces'
import { create } from 'zustand'

const useCartStore = create((set) => ({
  cartItems: [] as CartItem[],
  addToCart: (item: CartItem) =>
    set((state: { cartItems: CartItem[] }) => ({
      cartItems: [...state.cartItems, item],
    })),
  removeFromCart: (itemId: bigint) =>
    set((state: { cartItems: CartItem[] }) => ({
      cartItems: state.cartItems.filter(
        (item) => item.roomCategoryUuid !== itemId,
      ),
    })),
  clearCart: () => set({ cartItems: [] }),
}))

export default useCartStore
