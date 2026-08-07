import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/interview"
SESSION_ID = "test-session-full-flow"

# 1. First Turn: Send candidate data
payload_init = {
    "sessionId": SESSION_ID,
    "candidate": {
        "member": {
            "id": "CAND-001",
            "name": "Sarah Johnson",
            "jobRole": "Senior Data Engineer",
            "yearsExperience": 9,
            "education": "MS Computer Science",
            "status": "COMPLETED"
        },
        "missions": [
            { "day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1 }
        ],
        "signals": { "commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20 }
    }
}

print("--- Starting Interview (Turn 1) ---")
res = requests.post(BASE_URL, json=payload_init).json()
print(f"AI: {res.get('reply')}\nDone status: {res.get('done')}\n")

# Mock answers for subsequent turns
sample_answers = [
    "I used Sentence Transformers to generate embeddings and stored them in ChromaDB for fast retrieval.",
    "For RAG, I implemented a hybrid search combining vector similarity with structured SQL lookup.",
    "I handled prompt engineering by using structured system instructions and few-shot examples.",
    "When building agent tools, I defined clear Pydantic schemas to ensure structured output.",
    "For multi-agent orchestration, I used a router agent to direct queries to specific specialist agents.",
    "In terms of deployment, I containerized the FastAPI service using Docker and deployed it on Kubernetes.",
    "To ensure security, I sanitized user inputs to protect against prompt injection attacks.",
    "For observability, I configured structured logging and monitored API latency using Prometheus."
]

# 2. Subsequent Turns: Send candidate answers
for i, answer in enumerate(sample_answers, start=2):
    print(f"--- Turn {i} ---")
    payload_turn = {
        "sessionId": SESSION_ID,
        "message": answer
    }
    res = requests.post(BASE_URL, json=payload_turn).json()
    print(f"Candidate Answer: {answer}")
    print(f"AI Reply: {res.get('reply')}")
    print(f"Done Status: {res.get('done')}")
    
    if res.get('done'):
        print("\n================ INTERVIEW COMPLETED ================")
        print("Feedback Received:")
        print(json.dumps(res.get('feedback'), indent=2))
        break
    print("-" * 50)