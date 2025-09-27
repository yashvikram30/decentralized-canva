import { Input } from 'pixel-retroui';

function App() {
  return (
    <Input
    bg="#ddceb4"
    textColor="#30210b"
    borderColor="#30210b"
    placeholder="Enter text..."
    onChange={(e) => console.log(e.target.value)}
  />
  );
}