import { Route } from '../index'

import { useRoomCategories } from '../_hooks/use-room-categories'
import { SearchInput } from '#/components/reusable/search-input'
import { PaginationComponent } from '#/components/reusable/pagination'
import { RoomCard } from './room-card'
import type { RoomCategory } from '../_types/room-category'
import { Input } from '#/components/ui/input'

export function RoomPage() {
  const navigate = Route.useNavigate()

  const search = Route.useSearch()

  const { data, isLoading } = useRoomCategories({
    search: search.search,
    page: search.page,
    pageSize: search.pageSize,
    roomCategory: search.roomCategory,
    checkInDate: search.checkInDate,
    checkOutDate: search.checkOutDate,
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Find a Room</h1>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="checkInDate" className="text-sm font-medium">
            Check-in Date
          </label>
          <Input
            id="checkInDate"
            type="date"
            value={search.checkInDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  checkInDate: e.target.value,
                  page: 1,
                }),
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="checkOutDate" className="text-sm font-medium">
            Check-out Date
          </label>
          <Input
            id="checkOutDate"
            type="date"
            value={search.checkOutDate}
            min={search.checkInDate}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  checkOutDate: e.target.value,
                  page: 1,
                }),
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-48">
          <label className="text-sm font-medium">Search by hotel</label>
          <SearchInput
            value={search.search ?? ''}
            placeholder="Search by hotel name..."
            onSearch={(value) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  search: value || undefined,
                  page: 1,
                }),
              })
            }
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-48">
          <label className="text-sm font-medium">Search by room category</label>
          <SearchInput
            value={search.roomCategory ?? ''}
            placeholder="Search by room type..."
            onSearch={(value) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  roomCategory: value || undefined,
                  page: 1,
                }),
              })
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 h-40 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-16 text-gray-500">
          No rooms available for the selected dates and filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((room: RoomCategory) => (
            <RoomCard
              key={room.uuid}
              room={room}
              checkInDate={search.checkInDate}
              checkOutDate={search.checkOutDate}
            />
          ))}
        </div>
      )}

      {data && (
        <PaginationComponent
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          pageSize={data.meta.limit}
          totalItems={data.meta.total}
          onPageChange={(page) =>
            navigate({
              search: (prev) => ({
                ...prev,
                page,
              }),
            })
          }
          onPageSizeChange={(pageSize) =>
            navigate({
              search: (prev) => ({
                ...prev,
                page: 1,
                pageSize,
              }),
            })
          }
        />
      )}
    </div>
  )
}
