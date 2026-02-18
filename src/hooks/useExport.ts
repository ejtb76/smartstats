function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => headers.map(h => escapeCsvField(row[h] ?? '')).join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
