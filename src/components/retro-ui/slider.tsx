import { Slider } from 'pixel-retroui';

interface RetroSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
}

export default function RetroSlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className,
  label 
}: RetroSliderProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <Slider
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={step}
        bg="#ddceb4"
        textColor="#30210b"
        borderColor="#30210b"
        className="w-full"
      />
    </div>
  );
}
