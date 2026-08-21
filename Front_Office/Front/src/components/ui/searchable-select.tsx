import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

interface SearchableSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: string[]
  fieldName?: string
  ariaInvalid?: boolean
  disabled?: boolean
}

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  options,
  fieldName,
  ariaInvalid,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = React.useMemo(
    () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  )

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearch(val)
    onValueChange(val)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      setOpen(false)
      setSearch("")
    }
  }

  function handleSelect(option: string) {
    onValueChange(option)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} data-field={fieldName} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        data-invalid={ariaInvalid}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-1.5 rounded-xl border border-input bg-card px-4 text-sm text-foreground shadow-sm whitespace-nowrap transition-all duration-200 outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:shadow-md",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15",
          "dark:bg-white/5 dark:border-white/10 dark:focus-visible:border-ring dark:focus-visible:ring-ring/20",
          "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        )}
      >
        <span className={cn("flex-1 text-left truncate", !value && "text-muted-foreground/50")}>
          {value || placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "pointer-events-none size-4 text-muted-foreground/60 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full min-w-36 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
        >
          <div className="sticky top-0 z-10 border-b border-border/40 bg-popover px-2 pt-2 pb-1.5">
            <input
              ref={inputRef}
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder={placeholder}
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/15"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground/50">
                No results found
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={value === option}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "relative flex w-full cursor-default items-center gap-1.5 rounded-lg py-2 pr-8 pl-2 text-sm outline-hidden select-none transition-colors",
                    "hover:bg-primary/[0.08] hover:text-foreground",
                    value === option && "bg-primary/[0.06]"
                  )}
                >
                  <span className="flex-1 truncate">{option}</span>
                  {value === option && (
                    <CheckIcon className="pointer-events-none size-3.5 text-primary" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export { SearchableSelect }
