# cases/services.py
import requests
import json
from .models import CaseFile, CaseTimelineLog

class LocalLLMService:
    """
    Handles local execution pipelines using an offline inference engine (e.g., Ollama).
    """
    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL_NAME = "llama3" # Or your locally pulled model like mistral/gemma

    @classmethod
    def analyze_case_vulnerability(cls, case_file_id):
        try:
            case = CaseFile.objects.get(id=case_file_id)
        except CaseFile.DoesNotExist:
            return

        # 1. Structure a strict system/user prompt template
        prompt = f"""
        You are an expert educational and psychosocial counselor assistant.
        Analyze the following student profile indicators:
        - Monthly Absences: {case.monthly_absence_count}
        - Grade Average Delta: {case.grade_average_delta}
        - Missed Counseling Appointments: {case.missed_counseling_appointments}
        - Isolation Indicator Score (0-5): {case.isolation_indicator_score}
        - Raw Intake Notes: "{case.raw_intake_notes}"

        Provide a concise evaluation summary (max 3 sentences) assessing the student's risk priority level (Low, Medium, High) and recommending the immediate next action step.
        """

        payload = {
            "model": cls.MODEL_NAME,
            "prompt": prompt,
            "stream": False
        }

        try:
            # 2. Fire the inference request to your local background engine
            response = requests.post(cls.OLLAMA_URL, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                ai_analysis = result.get("response", "").strip()

                # 3. ✨ FIXED: Log using your actual model attributes (`system_notes`)
                CaseTimelineLog.objects.create(
                    case_file=case,
                    previous_state=case.status,
                    new_state=case.status,
                    system_notes=f"AI Vulnerability Assessment:\n{ai_analysis}"
                )
                
                # Optional: Update case status if risk is determined critical
                if "High" in ai_analysis and case.status == "INTAKE":
                    case.status = "ASSESSED" # updates lifecycle stage automatically
                    case.save()
                    
        except requests.exceptions.RequestException as e:
            # Prevent app crash if local engine is down, fall back gracefully
            print(f"Local LLM connection error: {e}")