# QAPT - Property Management Software

QAPT is a modern property management software built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Email/password authentication with Supabase Auth
- **User Roles**: Admin and Team Member roles
- **Row-Level Security**: Data is scoped to each user
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Theme toggle with localStorage persistence

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Supabase (Auth, Database)
- **State Management**: React Context
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Remix Icon
- **Charts**: ECharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Supabase Setup

1. Create a new Supabase project at [https://app.supabase.io](https://app.supabase.io)
2. Execute the SQL in `supabase/schema.sql` in the SQL Editor
3. Configure authentication settings in the Supabase dashboard
4. Get your API keys from Project Settings > API

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app`: Next.js App Router pages
- `/src/components`: Reusable UI components
- `/src/contexts`: React Context providers
- `/src/lib`: Utility functions and libraries
- `/src/styles`: Global styles and Tailwind configuration
- `/supabase`: Supabase schema and setup instructions
