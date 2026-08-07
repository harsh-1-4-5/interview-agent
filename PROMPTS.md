# AI Usage Log & Prompt History

## Prompt 1: Initial Repository & API Scaffold
Created base FastAPI project structure with `/api/interview` endpoint handling initial session payloads and follow-up candidate messages.

## Prompt 2: Data Integration & Context Parsing
Wrote `data_manager.py` to parse `candidates.json` and `curriculum.json`, creating a candidate profile summary for the system prompt.

## Prompt 3: Interviewer Agent Engine
Integrated Groq API with Llama 3.3 70B to power dynamic, multi-turn technical interview questions based on candidate context.

## Prompt 4: Evaluation & Feedback Schema
Implemented turn tracking and structured JSON output for post-interview evaluation (`summary`, `strengths`, `gaps`, `next`).

## Prompt 5: Next.js Frontend Interface
Scaffolded a modern Next.js client with candidate selection, real-time chat feed, loading states, and a summary scorecard screen.