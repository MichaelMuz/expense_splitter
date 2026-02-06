/**
 * SplitMethodPicker component - selector for EVEN/FIXED/PERCENTAGE split methods
 */

type SplitMethod = 'EVEN' | 'FIXED' | 'PERCENTAGE';

interface SplitMethodPickerProps {
  value: SplitMethod;
  onChange: (method: SplitMethod) => void;
  label?: string;
}

export function SplitMethodPicker({
  value,
  onChange,
  label = 'Split Method',
}: SplitMethodPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange('EVEN')}
          className={`px-4 py-2 text-sm font-medium rounded-md border ${
            value === 'EVEN'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Even
        </button>
        <button
          type="button"
          onClick={() => onChange('FIXED')}
          className={`px-4 py-2 text-sm font-medium rounded-md border ${
            value === 'FIXED'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Fixed
        </button>
        <button
          type="button"
          onClick={() => onChange('PERCENTAGE')}
          className={`px-4 py-2 text-sm font-medium rounded-md border ${
            value === 'PERCENTAGE'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Percent
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {value === 'EVEN' && 'Split equally among all selected members'}
        {value === 'FIXED' && 'Enter specific dollar amounts for each member'}
        {value === 'PERCENTAGE' && 'Enter percentages (must total 100%)'}
      </p>
    </div>
  );
}
