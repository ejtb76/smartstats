interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesField({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Notes (optional context for analysis)
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., Game was rained out after 5 innings, player #7 was injured..."
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
    </div>
  );
}
