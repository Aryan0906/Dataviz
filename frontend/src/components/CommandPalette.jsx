import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { commands } from '@/utils/commands';
import { useTheme } from '@/context/ThemeContext';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const filtered = commands.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (command) => {
    if (command && typeof command.action === 'function') {
      command.action();
    }
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div className={`cmdk-wrapper ${theme}`}> {/* theme class for dark/light */}
      <Command
        label="Command Palette"
        shouldFilter={false}
        onValueChange={setQuery}
        value={query}
        onSelect={handleSelect}
      >
        {filtered.map((c) => (
          <Command.Item key={c.id}>{c.name}</Command.Item>
        ))}
      </Command>
    </div>
  );
};

export default CommandPalette;
