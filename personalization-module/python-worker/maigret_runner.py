import json
import subprocess
from typing import List, Dict

MAIGRET_COMMAND = [
    'maigret',
    '--json',
    '--connection',
    'ssh',
]


def run_maigret_scan(username: str) -> List[Dict]:
    command = MAIGRET_COMMAND + [username]
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f'Maigret scan failed: {result.stderr.strip()}')

    try:
        raw = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f'Invalid Maigret JSON output: {exc}')

    profiles = []
    for site, data in raw.get('sites', {}).items():
        profiles.append({
            'platform': site,
            'profileUrl': data.get('url', ''),
            'status': data.get('status', ''),
            'confidenceScore': data.get('score'),
            'rawData': data,
        })

    return profiles
