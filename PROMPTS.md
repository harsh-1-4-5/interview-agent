# AI Usage Log & Prompt History

## Prompt 1: Initial Repository & API Scaffold
Created the base project structure and FastAPI backend with `/api/interview` endpoint.

## Prompt 2: Data Parsing and Context Generation
Wrote a utility script to load candidates.json and curriculum.json, cross-referencing a candidate's progress to build an LLM context string.

## Prompt 3: Interviewer LLM Engine Integration
Integrated Groq API using the OpenAI SDK format to drive the multi-turn interviewer agent logic and session management.

## Prompt 4: Feedback Generation Logic and API Schema Completion
Implemented turn counting and automated evaluation logic to generate structured feedback (summary, strengths, gaps, next) when the interview concludes.

## Prompt 5: Next.js Frontend Integration
Scaffolding a Next.js App Router project with a modern chat interface, session state management, and real-time feedback scorecard rendering.

## Prompt 6: Production API URL Configuration & CORS Alignment
Configured frontend environment variable and API fetch endpoint in `page.tsx` to target the deployed live Render backend (`https://interview-agent-api.onrender.com/api/interview`), enabling production deployment on Vercel.

## Prompt 7: Production Backend Endpoint Alignment & Deployment Patch
Resolved frontend-to-backend connection errors by updating the Next.js API client in `frontend/src/app/page.tsx` to route all `/api/interview` requests to the active Render backend (`https://interview-agent-api-8x97.onrender.com/api/interview`), adding environment variable fallbacks and verifying CORS configuration.

## Prompt 8: Production Environment Variable & API Authentication Fix
Configured valid GROQ_API_KEY environment variable on Render deployment to resolve HTTP 401 invalid API key exceptions during Groq model invocation.