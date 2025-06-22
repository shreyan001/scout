# LangGraph Backend Server

A LangGraph.js backend server for AI Web3 Lens applications. This server processes data from browser extensions and provides AI-powered responses using state-of-the-art language models.

## Features

- 🤖 **LangGraph.js Integration**: Advanced AI workflow orchestration
- 🔄 **Streaming Support**: Real-time responses via Server-Sent Events
- 🌐 **Web3 Ready**: Designed for blockchain and Lens protocol applications
- ⚡ **High Performance**: Built with TypeScript and Express.js
- 🔌 **Extension Integration**: Processes data from browser extensions
- 🛡️ **Type Safe**: Full TypeScript support

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- API key from either Groq or OpenAI

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.template .env
   ```

3. **Add your API key to `.env`:**
   ```bash
   # Choose one:
   GROQ_API_KEY=your_groq_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```http
GET /health
```
Returns server status information.

### Process Message
```http
POST /api/process
Content-Type: application/json

{
  "message": "Hello, analyze this Web3 data",
  "data": { "optional": "extension data" }
}
```

### Streaming Endpoint
```http
POST /api/stream
Content-Type: application/json

{
  "message": "Tell me about blockchain",
  "data": { "optional": "extension data" }
}
```
Returns real-time streamed responses via Server-Sent Events.

## Example Usage

### Basic Request
```javascript
const response = await fetch('http://localhost:3001/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Explain Web3 to me',
    data: { userAddress: '0x123...', network: 'ethereum' }
  })
});

const result = await response.json();
console.log(result.result);
```

### Streaming Request
```javascript
const response = await fetch('http://localhost:3001/api/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Analyze this transaction data',
    data: { txHash: '0xabc...', amount: '1.5 ETH' }
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port (default: 3001) | No |
| `GROQ_API_KEY` | Groq API key | Yes* |
| `OPENAI_API_KEY` | OpenAI API key | Yes* |
| `CORS_ORIGIN` | CORS origin (default: all) | No |

*At least one AI provider API key is required.

### Customizing the LangGraph

The AI logic is defined in `src/ai/simple-graph.ts`. You can:

1. **Add new nodes** to the graph for different processing steps
2. **Modify the state interface** to include more data fields
3. **Change the LLM model** or provider
4. **Add conditional logic** for complex workflows

Example of extending the graph:
```typescript
// Add a new node
workflow.addNode('analyze_transaction', analyzeTransactionNode);

// Add conditional edges
workflow.addConditionalEdges(
  'process_input',
  (state) => state.extensionData?.type === 'transaction' 
    ? 'analyze_transaction' 
    : END
);
```

## Development

### Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

### Project Structure

```
backend/
├── src/
│   ├── ai/
│   │   └── simple-graph.ts    # LangGraph definition
│   └── server-new.ts          # Express server
├── package.json
├── tsconfig.json
├── .env.template
└── README.md
```

## Production Deployment

1. **Build the project:**
   ```bash
   pnpm build
   ```

2. **Set production environment:**
   ```bash
   NODE_ENV=production
   ```

3. **Start the server:**
   ```bash
   pnpm start
   ```

## API Keys

### Groq (Recommended - Faster & Free)
1. Go to [Groq Console](https://console.groq.com/keys)
2. Create a new API key
3. Add it to your `.env` file

### OpenAI (Alternative)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [GitHub Issues](../../issues)
- Review the [LangGraph.js Documentation](https://js.langchain.com/docs/langgraph)
- Check the [API Documentation](#api-endpoints)

---

Built with ❤️ using LangGraph.js, TypeScript, and Express.js
