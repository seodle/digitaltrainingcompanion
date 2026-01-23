"""
Settings file.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# the locales used in the app
LOCALES = {
    "en":
    {
        "code": "en",
        "poeditor": "English"
    },
    "fr":
    {
        "code": "fr",
        "poeditor": "French"
    },
    "de":
    {
        "code": "de",
        "poeditor": "German"
    },
    "es":
    {
        "code": "es",
        "poeditor": "Spanish"
    },
    "it":
    {
        "code": "it",
        "poeditor": "Italian"
    }
}

# POEditor - Project ID from environment variable
POEDITOR_PROJECT_ID = os.getenv("POEDITOR_PROJECT_ID")
if not POEDITOR_PROJECT_ID:
    raise ValueError("POEDITOR_PROJECT_ID environment variable is not set. Please add it to your .env file.")