'use client'

import React, { useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import InfiniteScroll from '../ui/infinite-scroll'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  fetchCountries,
  fetchCountry,
  fetchMalaysiaOnly,
} from '@/app/(services)/geolocation-service'
import { Country } from '@/app/(lib)/schema/interfaces/xpatnova-geolocation'

interface CountryPickerProps {
  value?: string // encrypted_id
  onValueChange?: (encryptedId: string, country: Country) => void
  disabled?: boolean
  placeholder?: string
  onBlur?: () => void
  prefetchedCountry?: Country | null
  isMalaysiaOnly?: boolean
  onSelect?: (country: Country) => void
}

const CountryPicker = React.forwardRef<HTMLButtonElement, CountryPickerProps>(
  (
    {
      value,
      onValueChange,
      disabled = false,
      placeholder = 'Select country...',
      onBlur,
      prefetchedCountry,
      isMalaysiaOnly,
      onSelect,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [loading, setLoading] = React.useState(false)
    const [hasMore, setHasMore] = React.useState(true)
    const [countries, setCountries] = React.useState<Country[]>([])
    const [selectedCountry, setSelectedCountry] =
      React.useState<Country | null>(null)
    const [isFetchingInitial, setIsFetchingInitial] = React.useState(false)

    // Use ref to track loading state without causing re-renders
    const loadingRef = React.useRef(false)

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = React.useState(search)

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search)
      }, 300)

      return () => clearTimeout(timer)
    }, [search])

    // Reset pagination when search changes
    useEffect(() => {
      setCountries([])
      setPage(1)
      setHasMore(true)
    }, [debouncedSearch])

    // Store loadCountries in ref to keep stable reference
    const loadCountriesRef = React.useRef<
      (pageNum: number, searchTerm: string) => Promise<void>
    >(() => Promise.resolve())

    // Update the ref's current value on every render
    loadCountriesRef.current = async (pageNum: number, searchTerm: string) => {
      if (loadingRef.current) return

      loadingRef.current = true
      setLoading(true)

      try {
        let response
        if (isMalaysiaOnly) {
          const res = await fetchMalaysiaOnly()
          // Convert single country into the pagination format the component expects
          response = {
            success: res.success,
            data: res.data
              ? {
                  data: [res.data], // Wrap the single Malaysia object in an array
                  total: 1,
                  pageSize: 20,
                }
              : null,
          }
        } else {
          response = await fetchCountries(searchTerm, pageNum, 20)
        }
        //const response = await fetchCountries(searchTerm, pageNum, 20);

        if (response.success && response.data) {
          const newCountries = response.data.data

          if (pageNum === 1) {
            setCountries(newCountries as Country[])
          } else {
            setCountries((prev) => [...prev, ...(newCountries as Country[])])
          }

          // Check if there are more pages
          const totalPages = Math.ceil(
            response.data.total / response.data.pageSize,
          )
          setHasMore(pageNum < totalPages)
          setPage(pageNum)
        }
      } catch (error) {
        console.error('Failed to load countries:', error)
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }

    const loadCountryById = useCallback(
      async (encryptedId: string) => {
        if (!encryptedId) return

        setIsFetchingInitial(true)
        try {
          const response = await fetchCountry(encryptedId)
          if (response.success && response.data) {
            const country = response.data
            setSelectedCountry(country as Country)
            onSelect?.(country as Country)
            // Add to countries list if not already there
            setCountries((prev) => {
              if (!prev.find((c) => c.encrypted_id === encryptedId)) {
                return [country as Country, ...prev]
              }
              return prev
            })
          }
        } catch (error) {
          console.error('Failed to load country by ID:', error)
        } finally {
          setIsFetchingInitial(false)
        }
      },
      [onSelect],
    )

    // Load country by ID when value is provided - happens before popover opens
    useEffect(() => {
      // Skip API call if prefetched data is provided
      if (prefetchedCountry && prefetchedCountry.encrypted_id === value) {
        setSelectedCountry(prefetchedCountry)
        onSelect?.(prefetchedCountry)
        setIsFetchingInitial(false)
        return
      }

      if (value && !selectedCountry && !prefetchedCountry) {
        loadCountryById(value)
      }
    }, [value, selectedCountry, loadCountryById, prefetchedCountry, onSelect])

    // Sync selectedCountry when it's found in the loaded list
    useEffect(() => {
      if (value && countries.length > 0 && !selectedCountry) {
        const country = countries.find((c) => c.encrypted_id === value)
        if (country) {
          setSelectedCountry(country)
          onSelect?.(country)
        }
      }
    }, [value, countries, selectedCountry, onSelect])

    // Load initial data when popover opens
    useEffect(() => {
      if (open && countries.length === 0) {
        loadCountriesRef.current?.(1, '')
      }
    }, [open, countries.length])

    // Load countries when search changes - only if popover is open
    useEffect(() => {
      if (debouncedSearch && open) {
        loadCountriesRef.current?.(1, debouncedSearch)
      }
    }, [debouncedSearch, open])

    const next = useCallback(() => {
      if (!loadingRef.current && hasMore) {
        loadCountriesRef.current?.(page + 1, debouncedSearch)
      }
    }, [page, debouncedSearch, hasMore])

    const handleSelect = (country: Country) => {
      setSelectedCountry(country)
      onSelect?.(country)

      if (onValueChange) {
        onValueChange(country.encrypted_id, country)
      }

      onBlur?.()

      setOpen(false)
    }

    // Component is disabled when:
    // 1. Explicitly disabled via prop
    // 2. Currently fetching initial country data
    const isDisabled = disabled || isFetchingInitial

    return (
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className="w-full justify-between !rounded-md h-9 border-input shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-transparent font-normal disabled:bg-gray-100 disabled:border-gray-300 disabled:opacity-100 disabled:cursor-not-allowed"
          >
            <span className="truncate">
              {isFetchingInitial ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading country...
                </span>
              ) : selectedCountry ? (
                <span
                  className={cn(
                    'flex items-center gap-2 truncate',
                    isDisabled ? 'text-muted-foreground/80' : 'text-foreground',
                  )}
                >
                  {selectedCountry.name}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            {!isFetchingInitial && (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search country..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading...' : 'No country found.'}
              </CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.encrypted_id}
                    value={country.encrypted_id}
                    onSelect={() => handleSelect(country)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCountry?.encrypted_id === country.encrypted_id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {/* {country.flag_unicode && <span className="mr-2">{country.flag_unicode}</span>} */}
                    {country.name}
                  </CommandItem>
                ))}
                {hasMore && (
                  <InfiniteScroll
                    hasMore={hasMore}
                    isLoading={loading}
                    next={next}
                    threshold={0.8}
                  >
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </InfiniteScroll>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

CountryPicker.displayName = 'CountryPicker'

export default CountryPicker
