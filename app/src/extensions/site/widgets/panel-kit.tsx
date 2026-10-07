// Building blocks shared by the settings panels of the Sentinel widgets.
// A panel field reads and writes one widget property. Wix binds every property to an attribute of
// the element with the same name, so changing a field updates the widget on the canvas at once.

import React, { type FC, useCallback, useEffect, useState } from 'react';
import { widget } from '@wix/editor';
import { Box, Button, FormField, Input, InputArea, NumberInput, Text, ToggleSwitch } from '@wix/design-system';

// Writes go through one queue and are confirmed with getProp before the next starts, as Wix advises
// when a panel writes several properties.
let queue: Promise<unknown> = Promise.resolve();

export function writeProp(name: string, value: string): Promise<unknown> {
  queue = queue
    .then(() => widget.setProp(name, value))
    .then(() => widget.getProp(name))
    .catch((error) => console.error(`Could not save "${name}"`, error));
  return queue;
}

export function useProp(name: string, fallback = ''): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(fallback);

  useEffect(() => {
    widget
      .getProp(name)
      .then((stored) => setValue(stored ?? fallback))
      .catch((error) => console.error(`Could not read "${name}"`, error));
  }, [name, fallback]);

  const update = useCallback(
    (next: string) => {
      setValue(next);
      writeProp(name, next);
    },
    [name],
  );
  return [value, update];
}

export const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box direction="vertical" gap="12px" padding="18px 24px" borderBottom="1px solid #e8e8e8">
    <Text weight="bold" size="medium">
      {title}
    </Text>
    {children}
  </Box>
);

export const TextProp: FC<{ name: string; label: string; placeholder?: string; multiline?: boolean; info?: string }> = ({
  name,
  label,
  placeholder,
  multiline,
  info,
}) => {
  const [value, update] = useProp(name);
  return (
    <FormField label={label} infoContent={info}>
      {multiline ? (
        <InputArea value={value} placeholder={placeholder} rows={3} onChange={(event) => update(event.target.value)} />
      ) : (
        <Input value={value} placeholder={placeholder} onChange={(event) => update(event.target.value)} />
      )}
    </FormField>
  );
};

export const NumberProp: FC<{ name: string; label: string; min?: number; max?: number; info?: string }> = ({
  name,
  label,
  min,
  max,
  info,
}) => {
  const [value, update] = useProp(name);
  return (
    <FormField label={label} infoContent={info}>
      <NumberInput
        value={value === '' ? undefined : Number(value)}
        min={min}
        max={max}
        onChange={(next) => update(next === null || next === undefined ? '' : String(next))}
      />
    </FormField>
  );
};

// A switch stored as the text "true" or "false".
export const SwitchProp: FC<{ name: string; label: string; onValue?: string; offValue?: string; defaultOn?: boolean; info?: string }> = ({
  name,
  label,
  onValue = 'true',
  offValue = 'false',
  defaultOn = true,
  info,
}) => {
  const [value, update] = useProp(name, defaultOn ? onValue : offValue);
  return (
    <FormField label={label} labelPlacement="right" stretchContent={false} infoContent={info}>
      <ToggleSwitch checked={value !== offValue} onChange={(event) => update(event.target.checked ? onValue : offValue)} />
    </FormField>
  );
};

export interface ListColumn {
  key: string;
  label: string;
  type?: 'text' | 'switch';
}

type Row = Record<string, string | boolean>;

// Edits a list of rows that is saved as a JSON array in one property (the menu, a footer column's links).
export const ListProp: FC<{ name: string; label: string; columns: ListColumn[]; addLabel: string; max?: number }> = ({
  name,
  label,
  columns,
  addLabel,
  max = 12,
}) => {
  const [raw, setRaw] = useProp(name, '[]');
  let rows: Row[] = [];
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) rows = parsed;
  } catch (error) {
    rows = [];
  }

  const save = (next: Row[]) => setRaw(JSON.stringify(next));
  const change = (index: number, key: string, value: string | boolean) =>
    save(rows.map((row, at) => (at === index ? { ...row, [key]: value } : row)));

  return (
    <FormField label={label}>
      <Box direction="vertical" gap="12px">
        {rows.map((row, index) => (
          <Box key={index} direction="vertical" gap="6px" padding="12px" border="1px solid #e0e0e0" borderRadius="8px">
            {columns.map((column) =>
              column.type === 'switch' ? (
                <FormField key={column.key} label={column.label} labelPlacement="right" stretchContent={false}>
                  <ToggleSwitch checked={Boolean(row[column.key])} onChange={(event) => change(index, column.key, event.target.checked)} />
                </FormField>
              ) : (
                <Input
                  key={column.key}
                  size="small"
                  placeholder={column.label}
                  value={String(row[column.key] ?? '')}
                  onChange={(event) => change(index, column.key, event.target.value)}
                />
              ),
            )}
            <Box>
              <Button size="tiny" skin="destructive" priority="secondary" onClick={() => save(rows.filter((_, at) => at !== index))}>
                Remove
              </Button>
            </Box>
          </Box>
        ))}
        {rows.length < max && (
          <Box>
            <Button size="small" priority="secondary" onClick={() => save([...rows, Object.fromEntries(columns.map((c) => [c.key, c.type === 'switch' ? false : '']))])}>
              {addLabel}
            </Button>
          </Box>
        )}
      </Box>
    </FormField>
  );
};
