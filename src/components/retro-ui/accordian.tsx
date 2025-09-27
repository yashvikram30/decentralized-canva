import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'pixel-retroui';

function App() {
  return (
    <Accordion
  bg="#ddceb4"
  textColor="#30210b"
  borderColor="#30210b"
  shadowColor="#30210b"
  collapsible={true}
>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionContent>Content for section 2</AccordionContent>
  </AccordionItem>
</Accordion>
  );
}