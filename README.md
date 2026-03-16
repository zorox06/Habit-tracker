# Habit Tracker

A modern, full-stack Habit Tracker application designed to help users build better habits, track their progress, and visualize their daily routines.

## Tech Stack
- **Frontend Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Routing**: React Router
- **State Management**: React Query (@tanstack/react-query)
- **Forms and Validation**: react-hook-form, zod
- **Database/Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Data Visualization**: Recharts, Chart.js

## Features
- **User Authentication**: Secure Sign-in, Sign-up, and OAuth integration (Google Sign-In) using Supabase Auth.
- **Interactive Dashboard**: A comprehensive overview of today's progress, showing the number of completed habits, time spent, active habits, and daily goals.
- **Habit Management**: Create, view, update, and manage multiple habits with customizable fields like names, durations, categories (e.g., Development, Health, Wellness), and color tags.
- **Time/Session Tracking**: Track active habit sessions directly, logging the time spent toward daily duration targets.
- **Daily Progress Logging**: Track which habits have been completed each day, how much time was logged, and maintain habit streaks.
- **Analytics & Statistics**: Visualize long-term progress and time spent across different habits and categories.
- **Calendar Integration**: View habit logs via a dedicated Calendar page for a historical summary of activities.
- **Responsive Design**: Mobile-friendly, modern UI powered by Tailwind CSS and shadcn/ui.

## Database Schema Highlights
Powered by PostgreSQL (Supabase), the application includes the following main tables:
- **`profiles`**: Stores user information such as display name and timezone.
- **`habits`**: Core entity for tracking habit parameters (name, category, target duration, status, color).
- **`habit_logs`**: Daily tracking table ensuring one log per habit per day, capturing time spent and completion status.
- **`habit_sessions`**: Session-based time tracking for active habits.

All database tables are secured using Row Level Security (RLS) policies to ensure data privacy and user isolation.
