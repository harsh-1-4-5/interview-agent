import json
import os
from typing import Dict, Any

# Define paths relative to this file
# Assuming data_manager.py is in backend/ and the json files are in the parent directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANDIDATES_PATH = os.path.join(BASE_DIR, "candidates.json")
CURRICULUM_PATH = os.path.join(BASE_DIR, "curriculum.json")

# Cache to store loaded data
_candidates_data = None
_curriculum_data = None
_curriculum_dict: Dict[int, Any] = {}

def _load_data():
    global _candidates_data, _curriculum_data, _curriculum_dict
    
    if _candidates_data is None:
        try:
            with open(CANDIDATES_PATH, "r", encoding="utf-8") as f:
                _candidates_data = json.load(f)
        except FileNotFoundError:
            _candidates_data = {"candidates": []}
            
    if _curriculum_data is None:
        try:
            with open(CURRICULUM_PATH, "r", encoding="utf-8") as f:
                _curriculum_data = json.load(f)
                # Create a dictionary for O(1) lookups by day
                _curriculum_dict = {
                    day_info["day"]: day_info 
                    for day_info in _curriculum_data.get("days", [])
                }
        except FileNotFoundError:
            _curriculum_data = {"days": []}
            _curriculum_dict = {}

def get_candidate_context(candidate_id: str) -> str:
    """
    Finds a candidate by ID, cross-references their missions with the curriculum,
    and returns a concise text summary of their profile and progress.
    """
    _load_data()
    
    # Find the candidate
    candidate = next(
        (c for c in _candidates_data.get("candidates", []) if c.get("member", {}).get("id") == candidate_id), 
        None
    )
    
    if not candidate:
        return f"Candidate with ID '{candidate_id}' not found."
        
    member = candidate.get("member", {})
    name = member.get("name", "Unknown")
    role = member.get("jobRole", "Unknown Role")
    experience = member.get("yearsExperience", 0)
    
    missions = candidate.get("missions", [])
    
    completed_topics = []
    struggled_topics = []
    skipped_topics = []
    
    for mission in missions:
        day_num = mission.get("day")
        curriculum_info = _curriculum_dict.get(day_num, {})
        title = curriculum_info.get("title", mission.get("title", f"Day {day_num} Topic"))
        objectives = curriculum_info.get("objectives", [])
        
        # Build topic description including title and objectives
        topic_desc = f"{title}"
        if objectives:
            topic_desc += f" (Objectives: {'; '.join(objectives)})"
            
        if mission.get("skipped"):
            skipped_topics.append(topic_desc)
        elif mission.get("passed"):
            attempts = mission.get("attempts", 1)
            # A candidate can both successfully complete and struggle with a topic
            completed_topics.append(topic_desc)
            if attempts >= 3:
                struggled_topics.append(topic_desc)
                
    # Build the text summary
    summary_parts = []
    summary_parts.append("=== Candidate Profile ===")
    summary_parts.append(f"Name: {name}")
    summary_parts.append(f"Role: {role}")
    summary_parts.append(f"Experience: {experience} years")
    summary_parts.append("")
    
    summary_parts.append("=== Successfully Completed Topics ===")
    if completed_topics:
        for t in completed_topics:
            summary_parts.append(f"- {t}")
    else:
        summary_parts.append("- None")
    summary_parts.append("")
    
    summary_parts.append("=== Struggled Topics (3 or more attempts) ===")
    if struggled_topics:
        for t in struggled_topics:
            summary_parts.append(f"- {t}")
    else:
        summary_parts.append("- None")
    summary_parts.append("")
        
    summary_parts.append("=== Skipped Topics ===")
    if skipped_topics:
        for t in skipped_topics:
            summary_parts.append(f"- {t}")
    else:
        summary_parts.append("- None")
        
    return "\n".join(summary_parts)

# Expose the function
__all__ = ["get_candidate_context"]
