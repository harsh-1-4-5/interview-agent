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