import React, { useState, useRef, useEffect } from 'react';

interface TypeaheadOption {
  key: string;
  name: string;
}

interface TypeaheadProps {
  options: TypeaheadOption[];
  placeholder: string;
  onSelect: (key: string) => void;
  value: string;
  setValue: (v: string) => void;
  dropdownId?: string;
  inputId?: string;
  clearOnSelect?: boolean;
}

const Typeahead: React.FC<TypeaheadProps> = ({ options, placeholder, onSelect, value, setValue, dropdownId = 'typeahead-list', inputId = 'typeahead-input', clearOnSelect = true }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = options.filter(o => o.name.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!filtered.length) return;
    if (e.key === 'ArrowDown') {
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(i => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      if (clearOnSelect) setValue('');
      setShowDropdown(false);
      onSelect(filtered[activeIndex].key);
      e.preventDefault();
    }
  }

  function handleOptionClick(idx: number) {
    if (clearOnSelect) setValue('');
    setShowDropdown(false);
    onSelect(filtered[idx].key);
  }

  const activeId = `${dropdownId}-opt-${activeIndex}`;

  return (
    <div
      className="typeahead-container"
      style={{ width: '100%' }}
      role="combobox"
      aria-expanded={showDropdown && filtered.length > 0}
      aria-owns={dropdownId}
      aria-haspopup="listbox"
      aria-controls={dropdownId}
    >
      <input
        id={inputId}
        ref={inputRef}
        className="typeahead-input"
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? activeId : undefined}
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
      />
      <div
        id={dropdownId}
        className={`typeahead-dropdown${showDropdown && filtered.length ? ' active' : ''}`}
        style={{ width: '100%' }}
        role="listbox"
      >
        {showDropdown && filtered.map((obj, idx) => (
          <div
            id={`${dropdownId}-opt-${idx}`}
            key={obj.key}
            className={`typeahead-option${idx === activeIndex ? ' active' : ''}`}
            role="option"
            aria-selected={idx === activeIndex}
            onMouseDown={() => handleOptionClick(idx)}
          >
            {obj.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Typeahead;
