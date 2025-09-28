import { Input } from 'pixel-retroui';

export function RetroInput() {
  return (
    <Input
      bg="#ffffff"
      textColor="#000000"
      borderColor="#000000"
      placeholder="Enter text..."
      onChange={(e) => console.log(e.target.value)}
    />
  );
}