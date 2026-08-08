# pyrefly: ignore [missing-import]
import os
import sys
import uuid
from typing import Optional, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import groq

# Ensure the backend directory is in the python path to avoid import errors
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data_manager import get_candidate_context

# Robust dotenv loading using an absolute path to the backend directory
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env.local")
load_dotenv(dotenv_path=env_path, override=False)

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

# Initialize Groq lazily to handle missing API keys gracefully
def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("WARNING: GROQ_API_KEY not found in environment. Please set it in .env.local")
    return Groq(api_key=api_key or "missing_api_key")

@app.post("/api/interview")
async def interview_endpoint(request: InterviewRequest):
    try:
        groq_client = get_groq_client()
        
        # Scenario 1: New interview session
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
            except groq.AuthenticationError as e:
                print(f"CRITICAL ERROR: Groq Authentication Failed. Invalid API Key. {e}")
                return {"reply": "Error: Invalid API Key. Please check your backend configuration.", "done": True, "error": True}
            except Exception as e:
                print(f"ERROR: Failed to reach Groq: {e}")
                opening_question = f"Mock reply to your answer. (Failed to reach Groq: {str(e)})"
            
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
        
        # Scenario 2: Existing interview session with a message
        if request.message is not None and request.sessionId is not None:
            session_id = request.sessionId
            
            if session_id in sessions:
                session_state = sessions[session_id]
                messages = session_state["history"]
                messages.append({"role": "user", "content": request.message})
                question_count = session_state.get("question_count", 1)
                
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
                        import json
                        feedback_data = json.loads(llm_response)
                        return feedback_data
                    except groq.AuthenticationError as e:
                        print(f"CRITICAL ERROR: Groq Authentication Failed. Invalid API Key. {e}")
                        return {"reply": "Error: Invalid API Key. Please check your backend configuration.", "done": True, "error": True}
                    except Exception as e:
                        print(f"ERROR: Failed to reach Groq for feedback: {e}")
                        return {
                            "reply": f"Thank you for completing the interview! (Feedback generation failed: {str(e)})",
                            "done": True
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
                except groq.AuthenticationError as e:
                    print(f"CRITICAL ERROR: Groq Authentication Failed. Invalid API Key. {e}")
                    return {"reply": "Error: Invalid API Key. Please check your backend configuration.", "done": True, "error": True}
                except Exception as e:
                    print(f"ERROR: Failed to reach Groq: {e}")
                    llm_response = f"Mock reply to your answer. (Failed to reach Groq: {str(e)})"
                
                messages.append({"role": "assistant", "content": llm_response})
                session_state["question_count"] = question_count + 1
                
                return {
                    "reply": llm_response,
                    "done": False
                }
            else:
                return {
                    "reply": "Error: Session not found.",
                    "done": True
                }
                
        return {"reply": "Invalid payload format.", "done": True}
    except Exception as e:
        return {"reply": f"Internal Server Error: {str(e)}", "done": True}
