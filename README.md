# WalrusCanvas AI - Decentralized Design Tool

An AI-powered decentralized design tool with encrypted storage using Walrus and Seal for hackathon demonstration.

## 🚀 Features

- **AI-Powered Design**: Generate text, images, and design suggestions using OpenAI
- **Decentralized Storage**: Store designs securely using Walrus decentralized blob storage
- **End-to-End Encryption**: Protect designs with Seal identity-based encryption
- **Canvas Editor**: Full-featured design canvas with Fabric.js
- **Access Control**: Manage permissions and sharing with granular controls
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: Fabric.js
- **AI**: OpenAI GPT-4, DALL-E
- **Storage**: Walrus (decentralized blob storage)
- **Encryption**: Seal (identity-based encryption)
- **Blockchain**: Sui Network

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd decentralized_canva
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # AI Services
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
   NEXT_PUBLIC_ANTHROPIC_API_KEY=your_claude_key_here

   # Walrus Configuration  
   NEXT_PUBLIC_WALRUS_ENDPOINT=https://walrus-testnet.mystenlabs.com
   NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher-testnet.walrus.space

   # Sui Network
   NEXT_PUBLIC_SUI_NETWORK=testnet
   NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io

   # Mock Seal Configuration (for development)
   NEXT_PUBLIC_SEAL_ENABLED=true
   NEXT_PUBLIC_ENCRYPTION_MODE=mock
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Canvas Editor
- **Add Elements**: Use the toolbar to add text, shapes, and images
- **Edit Properties**: Select objects to modify their properties in the right panel
- **AI Assistant**: Generate content using AI prompts
- **Export/Import**: Save and load designs in various formats

### AI Features
- **Text Generation**: Create headlines, body text, and CTAs
- **Image Generation**: Generate custom illustrations and graphics
- **Design Analysis**: Get AI feedback on your designs
- **Color Suggestions**: AI-powered color palette recommendations

### Privacy & Security
- **Encryption Status**: Monitor encryption state of your designs
- **Access Control**: Manage user permissions and sharing
- **Decentralized Storage**: Store designs on Walrus network

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Canvas/           # Canvas editor components
│   ├── AI/              # AI-powered features
│   ├── Privacy/         # Encryption and access control
│   ├── Storage/         # Save/load functionality
│   └── UI/              # Reusable UI components
├── services/
│   ├── sealEncryption.ts    # Mock Seal encryption service
│   ├── walrusClient.ts      # Walrus storage client
│   ├── aiServices.ts        # OpenAI integration
│   ├── accessControl.ts     # Permission management
│   └── encryptedStorage.ts  # Combined storage service
├── hooks/
│   ├── useCanvas.ts         # Canvas state management
│   ├── useAI.ts             # AI service integration
│   ├── useEncryption.ts     # Encryption state
│   └── useWalrus.ts         # Storage operations
├── utils/
│   ├── constants.ts         # App constants
│   ├── aiPrompts.ts         # AI prompt templates
│   └── helpers.ts           # Utility functions
└── config/
    └── environment.ts       # Environment configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

1. **CanvasEditor**: Main canvas interface with toolbar and properties
2. **AIAssistant**: AI-powered content generation
3. **EncryptionStatus**: Shows encryption state
4. **AccessControlPanel**: Manage user permissions
5. **PropertyPanel**: Edit selected object properties

### Services

1. **SealEncryptionService**: Mock encryption (replace with real Seal SDK)
2. **WalrusClient**: Decentralized storage (replace with real Walrus SDK)
3. **AIService**: OpenAI integration for text and image generation
4. **AccessControlService**: Permission management
5. **EncryptedStorageService**: Combined storage with encryption

## 🚧 Development Notes

- **Mock Services**: Seal and Walrus services are mocked for development
- **API Keys**: Add your OpenAI API key to enable AI features
- **Fabric.js**: Canvas library with SSR support
- **TypeScript**: Full type safety throughout the application
- **Responsive**: Mobile-friendly design with Tailwind CSS

## 🎨 Customization

### Adding New AI Features
1. Create component in `src/components/AI/`
2. Add service method in `src/services/aiServices.ts`
3. Create hook in `src/hooks/useAI.ts`
4. Add to AIAssistant component

### Adding New Canvas Tools
1. Add tool to `src/components/Canvas/Toolbar.tsx`
2. Implement functionality in `src/hooks/useCanvas.ts`
3. Add properties to `src/components/Canvas/PropertyPanel.tsx`

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `src/app/globals.css` for global styles
- Use Tailwind classes throughout components

## 📝 License

This project is created for hackathon demonstration purposes.

## 🤝 Contributing

This is a hackathon project. For production use, replace mock services with real implementations:

1. **Seal SDK**: Replace mock encryption with real Seal SDK
2. **Walrus SDK**: Replace mock storage with real Walrus SDK
3. **Error Handling**: Add comprehensive error handling
4. **Testing**: Add unit and integration tests
5. **Security**: Implement proper security measures

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel
   ```

3. **Set environment variables** in your deployment platform

## 📞 Support

For questions or issues, please refer to the hackathon documentation or contact the development team.