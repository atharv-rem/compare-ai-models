# Compare AI Models

A feature-rich Next.js application designed to provide side-by-side comparisons of different AI models (specifically Sarvam 30B and Sarvam 105B). This tool helps developers and researchers evaluate model outputs, reasoning, and token usage in real-time.

## Features

- **Side-by-Side Comparison:** Chat with two AI models simultaneously to evaluate differences in reasoning, tone, and formatting.
- **Voice / Speech Input:** Talk to interact using built-in speech recognition capabilities.
- **Advanced Output Diffing:** Visually highlights the exact differences between model responses using an intuitive diff view and custom tokens.
- **Rich Markdown Rendering:** Seamlessly formats code and markdown text from model outputs.
- **Token Analytics:** Readily view output token counts to evaluate model verbosity.
- **Modern Animated UI:** Beautiful interface powered by Framer Motion, Tailwind CSS, and Lucide React components.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Motion](https://motion.dev/)
- **Web Speech API** for voice dictation.

## Getting Started

### Prerequisites

Make sure you have Node.js installed.

### Installation

1. Install the local dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Create a `.env.local` file in the root directory and add your Sarvam API key:

```env
SARVAM_API_KEY=your_api_key_here
```

3. Start the local development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

## Usage

1. Type a prompt in the input box, or click the microphone icon to dictate your prompt via voice.
2. Select your AI models or hit compare.
3. Observe how each model performs by reviewing the side-by-side output.
4. Toggle the diff view to see a token-by-token comparison of the models' responses.
