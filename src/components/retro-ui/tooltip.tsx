import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'pixel-retroui';

interface RetroTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export default function RetroTooltip({ children, content, className }: RetroTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          bg="#ddceb4"
          textColor="#30210b"
          borderColor="#30210b"
          shadowColor="#30210b"
          className={className}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
