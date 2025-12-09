# memorymesh Frontend

This is the frontend web application for memorymesh, built with Next.js 14, React 18, and TypeScript.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── health/        # Health check proxy
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── icon.tsx           # Favicon
│   └── apple-icon.tsx     # Apple touch icon
├── lib/                   # Utility libraries
│   ├── api-client.ts      # API client for backend
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── middleware.ts          # Next.js middleware
└── Configuration files    # package.json, tsconfig.json, etc.
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features

- Landing page with product information
- Interactive dashboard for API testing
- Real-time API integration with memorymesh backend
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
