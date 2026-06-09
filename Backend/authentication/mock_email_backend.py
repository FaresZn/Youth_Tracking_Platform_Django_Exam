# authentication/mock_email_backend.py
import os
import time
from django.core.mail.backends.base import BaseEmailBackend

class AutomaticMockEmailBackend(BaseEmailBackend):
    """
    Track D2/E2 Production Mock: Instantly intercepts and logs 
    outgoing OTP traffic to an automated local streaming inbox file.
    """
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        # Places the mock inbox log right in your main project folder
        self.log_filepath = os.path.join(os.getcwd(), 'mock_inbox.log')

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        saved_count = 0
        with open(self.log_filepath, 'a', encoding='utf-8') as f:
            for message in email_messages:
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                f.write("\n" + "="*60 + "\n")
                f.write(f"📥 AUTOMATIC MOCK INBOX DELIVERY — {timestamp}\n")
                f.write("="*60 + "\n")
                f.write(f"FROM:    {message.from_email}\n")
                f.write(f"TO:      {', '.join(message.to)}\n")
                f.write(f"SUBJECT: {message.subject}\n")
                f.write("-" * 40 + "\n")
                f.write(f"BODY:\n{message.body}\n")
                f.write("="*60 + "\n\n")
                saved_count += 1
                
        return saved_count