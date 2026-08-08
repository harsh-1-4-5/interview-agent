# AI Usage Log & Prompt History

## Prompt 1: Initial Repository & API Scaffold
Created base FastAPI project structure with `/api/interview` endpoint handling initial session payloads and follow-up candidate messages.

## Prompt 2: Data Integration & Context Parsing
Wrote `data_manager.py` to parse `candidates.json` and `curriculum.json`, creating a candidate profile summary for the system prompt.

## Prompt 3: Interviewer Agent Engine
Integrated Groq API with Llama 3.3 70B to power dynamic, multi-turn technical interview questions based on candidate context.

## Prompt 4: Evaluation & Feedback Schema
Implemented turn tracking and structured JSON output for post-interview evaluation (`summary`, `strengths`, `gaps`, `next`).

## Prompt 5: Next.js Frontend Integration
Scaffolding a Next.js App Router project with a modern chat interface, session state management, and real-time feedback scorecard rendering.

## Prompt 6: Production API URL Configuration & CORS Alignment
Configured frontend environment variable and API fetch endpoint in `page.tsx` to target the deployed live Render backend (`https://interview-agent-api.onrender.com/api/interview`), enabling production deployment on Vercel.

## Prompt 7: Production Backend Endpoint Alignment & Deployment Patch
Resolved frontend-to-backend connection errors by updating the Next.js API client in `frontend/src/app/page.tsx` to route all `/api/interview` requests to the active Render backend (`https://interview-agent-api-8x97.onrender.com/api/interview`), adding environment variable fallbacks and verifying CORS configuration.

## Prompt 8: Production Environment Variable & API Authentication Fix
Configured valid GROQ_API_KEY environment variable on Render deployment to resolve HTTP 401 invalid API key exceptions during Groq model invocation.
        
## Prompt 9: API Key Initialization & Session Recovery Patch
Hardened environment variable loading in `backend/main.py` using `python-dotenv` and explicit `os.environ` fallback for Groq client initialization. Added automatic session recovery on the frontend to reset invalid session IDs when backend authentication errors occur.

## Prompt 10: Complete State Recovery & Authentication Overhaul
Implemented a complete overhaul of the session state logic and Groq initialization. The backend now auto-recovers missing sessions instead of crashing, and initializes the Groq client dynamically per-request to prevent boot failures. The Next.js frontend now features automatic state clearing on API failure, ensuring broken sessions are immediately reset.

## Prompt 11: Feedback Dashboard Rendering & Type Safety Fix
Fixed a silent React rendering failure at the end of the interview by adding bulletproof type checking and optional chaining to the Next.js feedback dashboard. Ensure the UI safely handles strings, arrays, or missing data when the backend returns the final feedback payload.

## Prompt 12: Premium "Global Standard" UI Overhaul & Layout Fix
Completely redesigned the chat interface to match global SaaS design standards (e.g., Claude/Linear aesthetic). Resolved critical layout bugs where the fixed input container overlapped and obscured the most recent chat messages. Implemented a strict flexbox layout, custom webkit scrollbars, and premium Tailwind typography with max-width constraints for optimal readability.

## Prompt 13: UI Layout Fix & Scrollbar Removal
Fixed critical CSS flexbox alignment issues where user avatars and text bubbles were detached. Enforced a strict, centered `max-w-3xl` conversation column to match global SaaS standards (e.g., ChatGPT/Claude). Removed native scrollbar artifacts from the input text area and implemented a fixed bottom input container with a gradient fade.

## Prompt 14: Premium Glassmorphism & Deep Gradient Styling
Upgraded the application's visual identity by introducing a glassmorphism design system. Implemented dynamic radial background gradients, semi-transparent backdrop-blurred containers, and glowing gradient accents for user messages. Refined the input component with a frosted glass effect and interactive hover states to achieve a top-tier SaaS aesthetic.

## Prompt 15: PDF Scorecard Export Feature
Manually implemented a client-side PDF export feature using `html2pdf.js`. Added a dynamic download function to the Next.js frontend that captures the final Feedback Dashboard DOM element and converts it into a styled, high-resolution PDF scorecard without requiring backend rendering.

## Prompt 16: Sidebar Multi-View Dashboard & Session Telemetry Architecture
Overhauled the frontend architecture into an enterprise-grade multi-column dashboard inspired by professional developer tools. Replaced top-bar navigation with a fixed left sidebar featuring live-animated branding for "Interview Agent", interactive tabs for Live Interview, Curriculum, and Candidate Dashboard, and a New Interview/Reset action. Integrated a real-time Session Telemetry telemetry panel on the right, added a live motion background, and dynamically mapped curriculum data directly from candidate profiles to resolve build dependencies.