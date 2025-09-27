import { 
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
  } from 'pixel-retroui';
  
  function App() {
    return (
        <DropdownMenu
        bg="#fefcd0"
        textColor="black"
        borderColor="black"
        shadowColor="#c381b5"
      >
        <DropdownMenuTrigger>
          Click me
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Option 1</DropdownMenuItem>
          <DropdownMenuItem>Option 2</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Option 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }