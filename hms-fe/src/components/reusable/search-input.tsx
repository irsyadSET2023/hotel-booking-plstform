import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SearchInputProps {
  value?: string
  placeholder?: string
  className?: string
  debounceMs?: number
  onSearch: (value: string) => void
}

export function SearchInput({
  value = '',
  placeholder = 'Search...',
  className = '',
  debounceMs = 300,
  onSearch,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(inputValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [inputValue, debounceMs, onSearch])

  const resetSearch = () => {
    setInputValue('')
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="search">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </label>

      <Input
        id="search"
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
        className="px-8"
      />

      {inputValue && (
        <button
          type="button"
          onClick={resetSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
