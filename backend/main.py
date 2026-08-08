# pyrefly: ignore [missing-import]
import os
import sys
import json
import uuid
from typing import Optional, Dict, Any

from dotenv import load_dotenv

# Load .env.local at the very top; override=False so Render env vars take priority
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env.local")
load_dotenv(dotenv_path=env_path, override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

# Ensure the backend directory is in the python path to avoid import errors
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data_manager import get_candidate_context

# --- Startup debug log ---
_startup_key = os.environ.get("GROQ_API_KEY", "")
if _startup_key:
    print(f"[STARTUP] GROQ_API_KEY loaded, starts with: {_startup_key[:6]}...")
else:
    print("[STARTUP] WARNING: GROQ_API_KEY is NOT set in environment.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Interview Agent API is running! Send a POST request to /api/interview to interact."}

sessions: Dict[str, Any] = {}

class InterviewRequest(BaseModel):
    sessionId: Optional[str] = None
    candidate: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

SYSTEM_PROMPT_TEMPLATE = """You are a professional, realistic enterprise AI tech lead interviewer.
You are interviewing a candidate based on the following profile and curriculum progress:

{context}

Rules:
1. Act as a professional, realistic enterprise AI tech lead interviewer.
2. Ask one question at a time.
3. Target asking at least 8 total technical questions across 4 different curriculum days covered in the candidate context before completing the interview.
4. Adapt questions based on whether the candidate passed, skipped, or had multiple attempts on topics. (e.g., probe deeper if they struggled, or check basic understanding if they skipped).
5. Maintain a natural, multi-turn conversation flow rather than standard Q&A.
6. Begin the interview by welcoming them and asking the first question tailored to their background and the curriculum they have covered.
"""

@app.post("/api/interview")
async def interview_endpoint(request: InterviewRequest):
    # --- Dynamic per-request Groq init ---
    api_key = os.environ.get("GROQ_API_KEY", "").strip().strip('"').strip("'")
    if not api_key:
        print("ERROR: GROQ_API_KEY is missing on server")
        return {"reply": "Server configuration error: GROQ_API_KEY is missing. Please contact the administrator.", "done": True, "error": "GROQ_API_KEY is missing on server"}

    try:
        groq_client = Groq(api_key=api_key)
    except Exception as e:
        print(f"ERROR: Failed to initialize Groq client: {e}")
        return {"reply": f"Server error: Could not initialize AI client.", "done": True, "error": str(e)}

    try:
        # =============================================
        # Scenario 1: New interview session (candidate provided)
        # =============================================
        if request.candidate is not None:
            session_id = request.sessionId or str(uuid.uuid4())
            candidate_id = request.candidate.get("member", {}).get("id")

            context = get_candidate_context(candidate_id) if candidate_id else "No specific candidate context provided."
            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)
            messages = [{"role": "system", "content": system_prompt}]

            try:
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                opening_question = response.choices[0].message.content
            except Exception as e:
                print(f"ERROR: Groq API call failed during session start: {e}")
                return {"reply": f"Groq API Error: {str(e)}", "done": True, "error": str(e)}

            messages.append({"role": "assistant", "content": opening_question})
            sessions[session_id] = {
                "history": messages,
                "question_count": 1
            }

            return {
                "reply": opening_question,
                "done": False,
                "sessionId": session_id
            }

        # =============================================
        # Scenario 2: Continuing an existing session
        # =============================================
        if request.message is not None and request.sessionId is not None:
            session_id = request.sessionId

            # CRITICAL: Auto-recover missing sessions instead of erroring
            if session_id not in sessions:
                print(f"WARNING: Session '{session_id}' not found. Auto-recovering with empty history.")
                sessions[session_id] = {"history": [], "question_count": 0}

            session_state = sessions[session_id]
            messages = session_state["history"]
            messages.append({"role": "user", "content": request.message})
            question_count = session_state.get("question_count", 0)

            # Check if it's time to end the interview
            if question_count >= 8:
                feedback_prompt = """The interview is now complete. Please evaluate the candidate's performance based on the entire conversation history.
Ensure strengths, gaps, and next are lists of concise, actionable strings.
You MUST output your evaluation strictly as a valid JSON object matching the following structure exactly, with no additional text or markdown formatting:
{
  "reply": "Thank you for completing the interview! Here is your feedback.",
  "done": true,
  "feedback": {
    "summary": "High-level summary of candidate performance...",
    "strengths": ["Point 1", "Point 2"],
    "gaps": ["Area 1", "Area 2"],
    "next": ["Actionable step 1", "Actionable step 2"]
  }
}"""
                messages.append({"role": "system", "content": feedback_prompt})
                try:
                    response = groq_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=messages,
                        temperature=0.2,
                        max_tokens=1024,
                        response_format={"type": "json_object"}
                    )
                    llm_response = response.choices[0].message.content
                    feedback_data = json.loads(llm_response)
                    return feedback_data
                except Exception as e:
                    print(f"ERROR: Groq API call failed during feedback: {e}")
                    return {
                        "reply": f"Thank you for completing the interview! (Feedback generation failed: {str(e)})",
                        "done": True,
                        "error": str(e)
                    }

            # Ask the next question
            try:
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                llm_response = response.choices[0].message.content
            except Exception as e:
                print(f"ERROR: Groq API call failed during question: {e}")
                return {"reply": f"Groq API Error: {str(e)}", "done": True, "error": str(e)}

            messages.append({"role": "assistant", "content": llm_response})
            session_state["question_count"] = question_count + 1

            return {
                "reply": llm_response,
                "done": False
            }

        return {"reply": "Invalid payload format.", "done": True, "error": "Invalid payload"}
    except Exception as e:
        print(f"UNHANDLED ERROR in /api/interview: {e}")
        return {"reply": f"Internal Server Error: {str(e)}", "done": True, "error": str(e)}
