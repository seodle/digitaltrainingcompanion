"""
Various command line tools related to www.poeditor.com.

Requirements:

1. Go to DIGITAL-TRAINING-COMPANION/scripts/poeditor

2. Create a ".env" file in the script folder and declare in it
   the POEDITOR_API_KEY & OPENAI_API_KEY variables

3. Install required libraries
pip3 install requests python-dotenv openai

4.  Export the messages from poeditor to the platform
python3 poeditor.py export

5. Add new messages from CSV
python poeditor.py add_terms -file key_english_context.csv

- The CSV file should have columns: key, english, context
- key: the term's key (use snake case)
- english: the text in English
- context: the context to help the translator understand the message

"""

import argparse
import os
import shutil
import sys
import re
import requests
import csv
from dotenv import dotenv_values
import settings
import openai

# the script directory
DIR_SCRIPT = os.path.dirname(os.path.abspath(__file__))

# the environment file (you have to create it locally, it's not in git)
ENV_FILE = f"{DIR_SCRIPT}/.env"
ENV = dotenv_values(ENV_FILE)

# check that the POeditor API key is declared
if "POEDITOR_API_KEY" not in ENV:
    print(f"Error: variable POEDITOR_API_KEY must be defined in local env file {ENV_FILE}.\n")
    print("To create your API key go to https://poeditor.com/account/api")
    sys.exit(1)

# check that the OpenAI API key is declared
if "OPENAI_API_KEY" not in ENV:
    print(f"Error: variable OPENAI_API_KEY must be defined in local env file {ENV_FILE}.\n")
    print("The API key is available in your OpenAI account")
    sys.exit(1)

# Set OpenAI API key
openai.api_key = ENV['OPENAI_API_KEY']

def check_parameter(name, value):
    """Checks that the given parameter was given."""
    if not value or value.isspace():
        sys.exit(f"Error: parameter -{name} is mandatory")

def check_snake_case(name, value):
    """Checks that the given parameter is in snake case."""
    if not re.match("^[a-z0-9]+(?:_[a-z0-9]+)*$", value):
        sys.exit(f"Error: parameter -{name} value must be in snake case. Value given: '{value}'")

def add_translation(language, key, text):
    """Adds a translation for a given term."""
    data = f"""
[
    {{
        "term": "{key}",
        "context": "",
        "translation": {{
            "content": "{text}"
        }}
    }}
]"""
    data = data.strip()

    api_url = 'https://api.poeditor.com/v2/translations/add'
    api_params = {
        'api_token': ENV['POEDITOR_API_KEY'],
        'id': settings.POEDITOR_PROJECT_ID,
        'language': language,
        'data': data
    }

    api_response = requests.post(api_url, data=api_params).json()

    if api_response["response"]["code"] != "200":
        sys.exit(f"Error: could not add translation: {api_response}")

def add_context_to_term(key, context):
    """Adds a context to a given term and mark the related translations as 'Fuzzy'."""
    data = f"""
[
   {{
        "term": "{key}",
        "context": "",
        "new_term": "{key}",
        "new_context": "{context}"
    }}
]"""
    data = data.strip()

    api_url = 'https://api.poeditor.com/v2/terms/update'
    api_params = {
        'api_token': ENV['POEDITOR_API_KEY'],
        'id': settings.POEDITOR_PROJECT_ID,
        'data': data,
        'fuzzy_trigger': '1'
    }

    api_response = requests.post(api_url, data=api_params).json()

    if api_response["response"]["code"] != "200":
        sys.exit(f"Error: could not add context to term: {api_response}")

def term_exists(key):
    """Returns true if the given term exists."""
    api_url = 'https://api.poeditor.com/v2/terms/list'
    api_params = {
        'api_token': ENV['POEDITOR_API_KEY'],
        'id': settings.POEDITOR_PROJECT_ID
    }

    api_response = requests.post(api_url, data=api_params).json()

    terms = api_response["result"]["terms"]

    return any(term["term"] == key for term in terms)

def add_term(key, english, context):
    """Adds a new term."""
    check_parameter('key', key)
    check_snake_case('key', key)
    check_parameter('english', english)
    check_parameter('context', context)

    if term_exists(key):
        print(f"Warning: term '{key}' already exists. Skipping.")
        return

    data = f"""
[
   {{
        "term": "{key}",
        "context": "",
        "reference": "",
        "plural": "",
        "comment": ""
    }}
]"""
    data = data.strip()

    api_url = 'https://api.poeditor.com/v2/terms/add'
    api_params = {
        'api_token': ENV['POEDITOR_API_KEY'],
        'id': settings.POEDITOR_PROJECT_ID,
        'data': data
    }

    api_response = requests.post(api_url, data=api_params).json()

    if api_response["response"]["code"] != "200":
        sys.exit(f"Error: could not add term: {api_response}")

    for locale in settings.LOCALES.values():
        locale_code = locale["code"]
        text = english if locale_code == "en" else translate(english, locale_code)
        print(f"Translated '{english}' in {locale_code}: {text}")
        add_translation(locale_code, key, text)

    add_context_to_term(key, context)

def translate(english, target_lang):
    """Translates the given english text into the target language using OpenAI."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are a translator. Translate the following English text to {target_lang}. The translations are needed for an app that helps to monitor training. Provide only the translation, no explanations."},
                {"role": "user", "content": english}
            ],
            temperature=0,
            max_tokens=150
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        print(f"Error in translation: {str(e)}")
        return english  # Return original text if translation fails

def export_all():
    """Export all the locales."""
    for locale in settings.LOCALES.values():
        export(locale["code"])

def export(code):
    """Export the .json file for the locale having the given code."""
    locale = settings.LOCALES[code]

    print(f"Script directory: {DIR_SCRIPT}")

    from_path = f"/tmp/digitalTrainingCompagnion_{locale['poeditor']}.json"
    to_path = f"{DIR_SCRIPT}/../../src/assets/localizables/Localizable_{locale['code']}.json"

    print(f"Updating {to_path}")

    api_url = 'https://api.poeditor.com/v2/projects/export'
    api_params = {
        'api_token': ENV['POEDITOR_API_KEY'],
        'id': settings.POEDITOR_PROJECT_ID,
        'language': code,
        'type': 'json'
    }

    api_response = requests.post(api_url, data=api_params).json()

    download_url = api_response["result"]["url"]

    download_response = requests.get(download_url)

    with open(from_path, 'wb') as file:
        file.write(download_response.content)

    os.makedirs(os.path.dirname(to_path), exist_ok=True)
    shutil.copy(from_path, to_path)

def read_csv(file_path):
    """Reads the CSV file and returns a list of dictionaries."""
    terms = []
    with open(file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            terms.append({
                'key': row['key'],
                'english': row['english'],
                'context': row['context']
            })
    return terms

def process_terms(terms):
    """Process multiple terms from the CSV file."""
    for term in terms:
        print(f"Processing term: {term['key']}")
        add_term(term['key'], term['english'], term['context'])

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Script for interacting with www.poeditor.com.')
    parser.add_argument('action', type=str, help="The action, e.g. 'export' or 'add_terms'")
    parser.add_argument('-file', type=str, help="Path to the CSV file containing terms to add")

    args = parser.parse_args()

    if args.action == "export":
        print("Exporting .json files")
        export_all()
    elif args.action == "add_terms":
        if not args.file:
            sys.exit("Error: -file argument is required for 'add_terms' action")
        
        csv_path = os.path.join(DIR_SCRIPT, args.file)
        if not os.path.exists(csv_path):
            sys.exit(f"Error: CSV file not found: {csv_path}")
        
        terms = read_csv(csv_path)
        process_terms(terms)
    else:
        sys.exit(f"Unknown action: {args.action}")

if __name__ == "__main__":
    main()