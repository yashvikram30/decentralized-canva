import { Card } from 'pixel-retroui';

export function RetroCard() {
  return (
    <Card
      bg="#ffffff"
      textColor="#000000"
      borderColor="#000000"
      shadowColor="#000000"
      className="p-4 text-center"
    >
      <h2>Card Title</h2>
      <p>This is the card content.</p>
    </Card>
  );
}