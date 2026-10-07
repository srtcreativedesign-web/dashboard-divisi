import { ChangeEvent } from 'react';

type Column<T> = {
  key: keyof T;
  label: string;
  width?: string;
};

type DataGridInputProps<T> = {
  columns: Column<T>[];
  data: T[];
  onChange: (rowIndex: number, key: keyof T, value: string) => void;
};

export function DataGridInput<T extends object>({
  columns,
  data,
  onChange,
}: DataGridInputProps<T>) {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider text-xs">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-3 py-2.5 text-left border-r border-slate-200 last:border-r-0"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400 italic">
                Tidak ada data. Tambahkan baris baru.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50 group">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="p-0 border-r border-slate-100 last:border-r-0 relative"
                  >
                    <div className="relative w-full h-full flex items-center">
                      <input
                        type="text"
                        value={String(row[col.key] ?? '')}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onChange(rowIndex, col.key, e.target.value)
                        }
                        className="w-full h-full min-h-[36px] px-3 py-2 outline-none bg-transparent text-slate-900 placeholder-slate-300 focus:ring-1 focus:ring-inset focus:ring-blue-500 focus:bg-white"
                        placeholder="—"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
