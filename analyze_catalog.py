import json

# Load the catalog
with open('/workspaces/videoremix.vip2/streamlit_apps_catalog.json', 'r') as f:
    catalog = json.load(f)

# Function to analyze an app
def analyze_app(deps):
    providers = set()
    frameworks = set()
    special_reqs = set()
    
    for dep in deps:
        dep_lower = dep.lower()
        if 'openai' in dep_lower or 'openai-agents' in dep_lower:
            providers.add('OpenAI')
        if 'anthropic' in dep_lower:
            providers.add('Anthropic')
        if 'google-genai' in dep_lower or 'google-generativeai' in dep_lower:
            providers.add('Google Gemini')
        if 'groq' in dep_lower:
            providers.add('Groq')
        if 'together' in dep_lower:
            providers.add('Together AI')
        if 'cohere' in dep_lower:
            providers.add('Cohere')
        if 'ollama' in dep_lower:
            providers.add('Ollama')
        if 'agno' in dep_lower:
            frameworks.add('Agno')
        if 'langchain' in dep_lower:
            frameworks.add('LangChain')
        if 'crewai' in dep_lower:
            frameworks.add('CrewAI')
        if 'autogen' in dep_lower:
            frameworks.add('AutoGen')
        if 'whisper' in dep_lower or 'elevenlabs' in dep_lower or 'faster-whisper' in dep_lower:
            special_reqs.add('voice')
        if 'pillow' in dep_lower or 'opencv' in dep_lower or 'vision' in dep_lower:
            special_reqs.add('vision')
        if 'sentence-transformers' in dep_lower or 'embedchain' in dep_lower or 'fastembed' in dep_lower:
            special_reqs.add('embeddings')
        if 'rag' in dep_lower or 'qdrant' in dep_lower or 'chromadb' in dep_lower:
            special_reqs.add('embeddings')  # Assuming RAG uses embeddings
    
    # Determine target model
    target_models = set()
    if 'voice' in special_reqs:
        target_models.add('whisper')
    if 'vision' in special_reqs:
        target_models.add('gpt-4o')  # Vision capabilities
    if 'embeddings' in special_reqs:
        target_models.add('embeddings')
    if not target_models:
        target_models.add('gpt-4o')  # Default for text
    
    # Migration complexity
    if len(providers) == 1 and 'OpenAI' in providers:
        complexity = 'Low'
    elif len(providers) == 1:
        complexity = 'Medium'
    else:
        complexity = 'High'
    
    # Conversion type
    if len(frameworks) > 0:
        conversion = 'manual SDK changes'
    else:
        conversion = 'automated find-replace'
    if len(providers) > 1 or 'vision' in special_reqs or 'voice' in special_reqs:
        conversion = 'alternative needed'
    
    return {
        'current_providers': list(providers),
        'target_models': list(target_models),
        'complexity': complexity,
        'frameworks': list(frameworks),
        'special_reqs': list(special_reqs),
        'conversion': conversion
    }

# Process all apps
migration_matrix = {}
for category, apps in catalog.items():
    migration_matrix[category] = {}
    for app_name, app_data in apps.items():
        deps = app_data.get('dependencies', [])
        analysis = analyze_app(deps)
        migration_matrix[category][app_name] = {
            'current_providers': analysis['current_providers'],
            'target_models': analysis['target_models'],
            'complexity': analysis['complexity'],
            'frameworks': analysis['frameworks'],
            'special_reqs': analysis['special_reqs'],
            'conversion': analysis['conversion']
        }

# Summary stats
total_apps = sum(len(apps) for apps in catalog.values())
complexity_counts = {'Low': 0, 'Medium': 0, 'High': 0}
conversion_counts = {'automated find-replace': 0, 'manual SDK changes': 0, 'alternative needed': 0}
framework_counts = {}
provider_counts = {}
special_counts = {}

for category, apps in migration_matrix.items():
    for app_name, data in apps.items():
        complexity_counts[data['complexity']] += 1
        conversion_counts[data['conversion']] += 1
        for fw in data['frameworks']:
            framework_counts[fw] = framework_counts.get(fw, 0) + 1
        for prov in data['current_providers']:
            provider_counts[prov] = provider_counts.get(prov, 0) + 1
        for spec in data['special_reqs']:
            special_counts[spec] = special_counts.get(spec, 0) + 1

# Output
print("Migration Matrix:")
for category, apps in migration_matrix.items():
    print(f"\n{category.upper()}:")
    for app_name, data in apps.items():
        print(f"  {app_name}:")
        print(f"    Current Providers: {', '.join(data['current_providers'])}")
        print(f"    Target Models: {', '.join(data['target_models'])}")
        print(f"    Complexity: {data['complexity']}")
        print(f"    Frameworks: {', '.join(data['frameworks'])}")
        print(f"    Special Requirements: {', '.join(data['special_reqs'])}")
        print(f"    Conversion Type: {data['conversion']}")

print("\nSummary Statistics:")
print(f"Total Apps: {total_apps}")
print(f"Complexity: {complexity_counts}")
print(f"Conversion Types: {conversion_counts}")
print(f"Frameworks: {framework_counts}")
print(f"Providers: {provider_counts}")
print(f"Special Requirements: {special_counts}")