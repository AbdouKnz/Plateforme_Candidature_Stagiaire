import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

interface SearchableSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: string[]
  ariaInvalid?: boolean
  disabled?: boolean
  otherOption?: string
  onOtherChange?: (value: string) => void
}

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  options,
  ariaInvalid,
  disabled,
  otherOption,
  onOtherChange,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [otherMode, setOtherMode] = React.useState(false)
  const [otherInput, setOtherInput] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const textInputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = React.useMemo(
    () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  )

  React.useEffect(() => {
    if (open && inputRef.current && !otherMode) {
      inputRef.current.focus()
    }
    if (open && otherMode && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [open, otherMode])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
        setOtherMode(false)
        setOtherInput("")
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  function handleSelect(option: string) {
    onValueChange(option)
    if (onOtherChange) onOtherChange("")
    setOpen(false)
    setSearch("")
    setOtherMode(false)
  }

  function handleOtherClick() {
    setOtherMode(true)
    setSearch("")
  }

  function handleOtherTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setOtherInput(val)
    onOtherChange?.(val)
    onValueChange(val)
  }

  function handleOtherKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && otherInput.trim()) {
      setOpen(false)
      setOtherMode(false)
      setOtherInput("")
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) {
            setOtherMode(false)
            setOtherInput("")
          }
          setOpen((prev) => !prev)
        }}
        data-invalid={ariaInvalid}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-1.5 rounded-xl border border-input bg-white/70 px-4 text-sm text-foreground shadow-sm whitespace-nowrap transition-all duration-200 outline-none select-none",
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

      {open && !otherMode && (
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/15"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
            {filteredOptions.length === 0 && !otherOption ? (
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
          {otherOption && (
            <div className="border-t border-border/40 p-1">
              <button
                type="button"
                onClick={handleOtherClick}
                className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/[0.08] hover:text-foreground"
              >
                {otherOption}
              </button>
            </div>
          )}
        </div>
      )}

      {open && otherMode && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 p-3",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
        >
          <input
            ref={textInputRef}
            type="text"
            value={otherInput}
            onChange={handleOtherTextChange}
            onKeyDown={handleOtherKeyDown}
            placeholder={otherOption}
            className="w-full rounded-xl border border-input bg-background/50 px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/15"
          />
        </div>
      )}
    </div>
  )
}

export { SearchableSelect }
