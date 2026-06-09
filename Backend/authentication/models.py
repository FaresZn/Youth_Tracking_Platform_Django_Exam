# authentication/models.py
from django.db import models
from django.contrib.auth.models import User
import random
from django.utils import timezone
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserOTP(models.Model):
    """
    Stores temporary 6-digit cryptographic verification codes for administrative users.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='otp_profile')
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.zone}"

    def generate_otp(self):
        """Generates a random 6-digit token valid for 10 minutes."""
        self.otp_code = f"{random.randint(100000, 999999)}"
        self.is_verified = False
        self.save()
        return self.otp_code

    def is_valid(self):
        """Checks if the OTP has expired (10-minute window)."""
        return timezone.now() < self.created_at + timedelta(minutes=10)
    


# Define the missing UserProfile model
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    zone = models.CharField(max_length=100, blank=True, null=True, help_text="City, state, or operational zone")

    def __str__(self):
        return f"{self.user.username} - {self.zone or 'No Zone'}"

# Signal automation to guarantee every user has a profile record automatically
@receiver(post_save, sender=User)
def manage_user_profile_node(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)