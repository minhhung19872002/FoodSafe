import type { ReactNode } from "react";
import { Descriptions, Drawer, Empty } from "antd";

export interface DetailField<T> {
  label: string;
  /** Render the value; return null/undefined/"" to show "—". */
  render: (record: T) => ReactNode;
  /** Descriptions span (default 1). */
  span?: number;
}

interface RecordDetailDrawerProps<T> {
  title: string;
  record: T | null;
  fields: DetailField<T>[];
  onClose: () => void;
  /** Extra content rendered below the Descriptions (tabs, tables...). */
  children?: ReactNode;
  width?: number;
}

function displayValue(value: ReactNode): ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

/**
 * Generic read-only detail drawer for list rows.
 * Open it from a row double-click via `detailRowProps`.
 */
export function RecordDetailDrawer<T>({
  title,
  record,
  fields,
  onClose,
  children,
  width = 640,
}: RecordDetailDrawerProps<T>) {
  return (
    <Drawer
      title={title}
      open={record !== null}
      onClose={onClose}
      width={width}
      destroyOnHidden
    >
      {record === null ? (
        <Empty />
      ) : (
        <>
          <Descriptions
            column={2}
            size="small"
            bordered
            labelStyle={{ width: 160 }}
          >
            {fields.map((f) => (
              <Descriptions.Item key={f.label} label={f.label} span={f.span ?? 1}>
                {displayValue(f.render(record))}
              </Descriptions.Item>
            ))}
          </Descriptions>
          {children}
        </>
      )}
    </Drawer>
  );
}
