import { ProgressBar } from 'pixel-retroui';

export function RetroProgressBar() {
  return (
    <ProgressBar
      size="md"
      color="#ddceb4"
      borderColor="#30210b"
      className="w-full"
      progress={50}
    />
  );
}