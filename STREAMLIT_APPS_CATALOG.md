# Streamlit Applications Catalog - awesome-llm-apps
**Total: 111 Streamlit applications**  
**Catalog Date: 2026-04-29**  
**Source: /workspaces/videoremix.vip2/awesome-llm-apps**  
**Migration Status: 95%+ now use OpenAI GPT-4o (May 2026)**

---

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Streamlit Apps | 111 | 100% |
| OpenAI-first (GPT-4o) | 106 | 95.5% |
| Specialized provider retained | 5 | 4.5% |
| With requirements.txt | 110 | 99.1% |
| Using st.secrets | 1 | 0.9% |
| Using os.getenv | 43 | 38.7% |
| With .streamlit/config.toml | 0* | 0.0% |

*Note: One app (ai_speech_trainer_agent) has `.streamlit/config.toml` in its `frontend/` subdirectory.

---

## Category Breakdown

### 1. STARTER_AI_AGENTS (16 apps)

All 16 have requirements.txt. None use st.secrets. 4 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | ai_blog_to_podcast_agent | blog_to_podcast_agent.py | agno, elevenlabs, firecrawl-py, openai, streamlit | Yes |
| 2 | ai_breakup_recovery_agent | ai_breakup_recovery_agent.py | agno, duckduckgo-search, google-genai, pillow, streamlit | No |
| 3 | ai_data_analysis_agent | ai_data_analyst.py | agno, duckdb, numpy, openai, pandas, streamlit | No |
| 4 | ai_data_visualisation_agent | ai_data_visualisation_agent.py | e2b, e2b-code-interpreter, matplotlib, pandas, pillow, streamlit, together | No |
| 5 | ai_life_insurance_advisor_agent | life_insurance_advisor_agent.py | agno, e2b-code-interpreter, firecrawl-py, openai, streamlit | Yes |
| 6 | ai_medical_imaging_agent | ai_medical_imaging.py | agno, duckduckgo-search, **google-generativeai**, pillow, streamlit | No |
| 7 | ai_meme_generator_agent_browseruse | ai_meme_generator_agent.py | browser-use, **langchain-openai**, playwright, streamlit | No |
| 8 | ai_music_generator_agent | music_generator_agent.py | agno, openai, requests, streamlit | No |
| 9 | ai_reasoning_agent | local_ai_reasoning_agent.py | numpy, **openai**, pandas, pillow, plotly, python-dotenv, requests, streamlit | No |
| 10 | ai_startup_trend_analysis_agent | startup_trends_agent.py | agno, duckduckgo_search, lxml_html_clean, newspaper4k, **openai**, streamlit | No |
| 11 | ai_travel_agent | local_travel_agent.py | agno, google-search-results, icalendar, **openai**, streamlit | No |
| 12 | mixture_of_agents | mixture-of-agents.py | asyncio, streamlit, together | Yes |
| 13 | multimodal_ai_agent | multimodal_reasoning_agent.py | agno, google-generativeai, streamlit | No |
| 14 | openai_research_agent | research_agent.py | openai, openai-agents, pydantic, python-dotenv, streamlit | Yes |
| 15 | web_scraping_ai_agent | local_ai_scrapper.py | playwright, scrapegraphai, streamlit | No |
| 16 | xai_finance_agent | xai_finance_agent.py | agno, duckduckgo-search, yfinance | Yes |

**Notable:** xai_finance_agent uses st.secrets.

---

### 2. VOICE_AI_AGENTS (3 apps)

All have requirements.txt. 2 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | ai_audio_tour_agent | ai_audio_tour_agent.py | openai, openai-agents, pydantic, python-dotenv, rich, streamlit | No |
| 2 | customer_support_voice_agent | customer_support_voice_agent.py | fastembed, firecrawl-py, openai, openai-agents, python-dotenv, qdrant-client, streamlit | Yes |
| 3 | voice_rag_openaisdk | rag_voice.py | fastembed, langchain, langchain-community, langchain-openai, langchain-text-splitters, openai, openai-agents, qdrant-client, streamlit | Yes |

---

### 3. RAG_TUTORIALS (20 apps)

All have requirements.txt. 6 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | agentic_rag_embedding_gemma | agentic_rag_embeddinggemma.py | agno, lancedb, ollama, pypdf, streamlit | No |
| 2 | agentic_rag_gpt5 | agentic_rag_gpt5.py | agno, lancedb, openai, python-dotenv, streamlit | Yes |
| 3 | agentic_rag_math_agent | app/streamlit.py | dspy, faiss-cpu, llama-index, llama-index-vector-stores-qdrant, openai, qdrant-client, streamlit, tavily-python | No |
| 4 | agentic_rag_with_reasoning | rag_reasoning_agent.py | agno, lancedb, openai, python-dotenv, streamlit | Yes |
| 5 | ai_blog_search | app.py | beautifulsoup4, langchain, langchain-community, langchain-google-genai, langchain-qdrant, langchain-text-splitters, langchainhub, langgraph, python-dotenv, tiktoken | No |
| 6 | autonomous_rag | autorag.py | agno, duckduckgo-search, nest_asyncio, openai, pgvector, psycopg-binary, pypdf, requests, sqlalchemy, streamlit | No |
| 7 | contextualai_rag_agent | contextualai_rag_agent.py | contextual-client, pydantic, requests, streamlit | No |
| 8 | corrective_rag | corrective_rag.py | langchain, langchain-anthropic, langchain-community, langchain-core, langchain-openai, langgraph, qdrant-client, streamlit, tavily-python | No |
| 9 | deepseek_local_rag_agent | deepseek_rag_agent.py | agno, exa, langchain-community, langchain-qdrant, ollama, qdrant-client, streamlit | No |
| 10 | gemini_agentic_rag | agentic_rag_gemini.py | agno, exa, langchain-community, langchain-qdrant, qdrant-client, streamlit | Yes |
| 11 | hybrid_search_rag | main.py | cohere, openai, psycopg2-binary, pydantic, pypdf, python-dotenv, raglite, rerankers, spacy, sqlalchemy, streamlit | Yes |
| 12 | knowledge_graph_rag_citations | knowledge_graph_rag.py | neo4j, ollama, streamlit | Yes |
| 13 | llama3.1_local_rag | llama3.1_local_rag.py | langchain, langchain_community, langchain_ollama, ollama, streamlit | No |
| 14 | local_hybrid_search_rag | local_main.py | llama-cpp-python, psycopg2-binary, pydantic, pypdf, python-dotenv, raglite, rerankers, sentence-transformers, spacy, sqlalchemy, streamlit | No |
| 15 | qwen_local_rag | qwen_local_rag_agent.py | agno, exa, langchain-community, langchain-qdrant, ollama, pypdf, qdrant-client, streamlit | No |
| 16 | rag-as-a-service | rag_app.py | anthropic, requests, streamlit | No |
| 17 | rag_agent_cohere | rag_agent_cohere.py | cohere, duckduckgo-search, langchain, langchain-cohere, langchain-community, langchain-core, langchain-qdrant, qdrant-client, streamlit | No |
| 18 | rag_chain | app.py | chromadb, langchain-chroma, langchain-community, langchain-core, langchain-google-genai, pypdf2, python-dotenv, sentence-transformers, streamlit | No |
| 19 | rag_database_routing | rag_database_routing.py | agno, langchain, langchain-community, langchain-core, langchain-openai, langgraph, pypdf, qdrant-client, sentence-transformers, streamlit | Yes |
| 20 | vision_rag | vision_rag.py | cohere, google-generativeai, numpy, pillow, pymupdf, requests, streamlit, tqdm | No |

---

### 4. ADVANCED_LLM_APPS (19 apps)

All have requirements.txt. 9 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | ai_arxiv_agent_memory | ai_arxiv_agent_memory.py | mem0ai, multion, openai, streamlit | Yes |
| 2 | ai_travel_agent_memory | travel_agent_memory.py | mem0ai, openai, streamlit | No |
| 3 | chat-with-tarots | app.py | langchain, langchain-core, langchain-ollama, ollama, pandas, streamlit | No |
| 4 | chat_with_github | chat_github.py | embedchain[github], streamlit | Yes |
| 5 | chat_with_gmail | chat_gmail.py | embedchain[gmail], streamlit | No |
| 6 | chat_with_pdf | chat_pdf_llama3.py | embedchain, streamlit, streamlit-chat | No |
| 7 | chat_with_research_papers | chat_arxiv.py | agno, arxiv, openai, pypdf, streamlit | No |
| 8 | chat_with_substack | chat_substack.py | embedchain, streamlit | No |
| 9 | chat_with_youtube_videos | chat_youtube.py | embedchain[youtube], streamlit, youtube-transcript-api | No |
| 10 | cursor_ai_experiments | multi_agent_researcher.py | crewai, langchain-community, ollama, playwright, scrapegraphai, streamlit, streamlit-chat | Yes |
| 11 | gpt_oss_critique_improvement_loop | streamlit_app.py | groq, streamlit | Yes |
| 12 | llama3_stateful_chat | local_llama3_chat.py | openai, streamlit | No |
| 13 | llm_app_personalized_memory | llm_app_memory.py | mem0ai, openai, streamlit | Yes |
| 14 | llm_router_app | llm_router.py | routellm[serve,eval], routellm, streamlit | Yes |
| 15 | local_chatgpt_clone | chatgpt_clone_llama3.py | openai, streamlit | No |
| 16 | local_chatgpt_with_memory | local_chatgpt_memory.py | litellm, mem0ai, openai, streamlit | No |
| 17 | multi_llm_memory | multi_llm_memory.py | litellm, mem0ai, openai, streamlit | Yes |
| 18 | resume_job_matcher | app.py | pymupdf, requests, streamlit | No |
| 19 | toonify_token_optimization | toonify_app.py | anthropic, openai, pandas, streamlit, tiktoken, toonify | No |

---

### 5. ADVANCED_AI_AGENTS (37 apps)

All have requirements.txt. 18 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | ag2_adaptive_research_team | app.py | ag2[openai], pypdf, streamlit | Yes |
| 2 | ai_3dpygame_r1 | ai_3dpygame_r1.py | agno, browser-use, langchain-openai, streamlit | No |
| 3 | ai_aqi_analysis_agent | ai_aqi_analysis_agent_streamlit.py | agno, dataclasses, firecrawl-py, gradio, openai, pydantic | No |
| 4 | ai_chess_agent | ai_chess_agent.py | autogen, cairosvg, chess, pillow, streamlit | No |
| 5 | ai_competitor_intelligence_agent_team | competitor_agent_team.py | agno, duckduckgo-search, firecrawl-py, streamlit | No |
| 6 | ai_customer_support_agent | customer_support_agent.py | mem0ai, openai, streamlit | Yes |
| 7 | ai_deep_research_agent | deep_research_openai.py | firecrawl, firecrawl-py, openai-agents, streamlit | No |
| 8 | ai_domain_deep_research_agent | ai_domain_deep_research_agent.py | agno, composio, composio-agno, streamlit, together | Yes |
| 9 | ai_email_gtm_outreach_agent | ai_email_gtm_outreach_agent.py | agno, exa_py, openai, pydantic, streamlit | Yes |
| 10 | ai_email_gtm_reachout_agent | ai_email_gtm_reachout.py | agno, openai, pydantic, streamlit | Yes |
| 11 | ai_financial_coach_agent | ai_financial_coach_agent.py | asyncio, google-adk, matplotlib, numpy, pandas, plotly, python-dotenv, streamlit | Yes |
| 12 | ai_fraud_investigation_agent | fraud_investigation_agent.py | agno, beautifulsoup4, openai, requests, streamlit | No |
| 13 | ai_game_design_agent_team | game_design_agent_team.py | autogen, streamlit | No |
| 14 | ai_health_fitness_agent | health_agent.py | agno, google-generativeai, streamlit | No |
| 15 | ai_journalist_agent | journalist_agent.py | agno, google-search-results, lxml_html_clean, newspaper4k, openai, streamlit | No |
| 16 | ai_legal_agent_team | legal_agent_team.py | agno, duckduckgo-search, openai, pypdf, qdrant-client, streamlit | Yes |
| 17 | ai_meeting_agent | meeting_agent.py | crewai, crewai-tools, openai, streamlit | Yes |
| 18 | ai_mental_wellbeing_agent | ai_mental_wellbeing_agent.py | autogen-agentchat, autogen-ext, pyautogen, streamlit | Yes |
| 19 | ai_movie_production_agent | movie_production_agent.py | agno, google-search-results, lxml_html_clean, streamlit | No |
| 20 | ai_personal_finance_agent | finance_agent.py | agno, google-search-results, openai, streamlit | No |
| 21 | ai_real_estate_agent_team | local_ai_real_estate_agent_team.py | agno, firecrawl-py, googlesearch-python, openai, pydantic, python-dotenv, requests, streamlit | Yes |
| 22 | ai_recipe_meal_planning_agent | ai_recipe_meal_planning_agent.py | agno, duckduckgo-search, python-dotenv, requests, streamlit | Yes |
| 23 | ai_recruitment_agent_team | ai_recruitment_agent_team.py | agno, black, phidata, pypdf2, python-dateutil, pytz, requests, streamlit, streamlit-pdf-viewer, typing-extensions | No |
| 24 | ai_services_agency | agency.py | agency-swarm, python-dotenv, streamlit | Yes |
| 25 | ai_speech_trainer_agent | frontend/Home.py | agno, deepface, mediapipe, openai, opencv-python, pandas, plotly, requests, streamlit, tf-keras | No |
| 26 | ai_startup_insight_fire1_agent | ai_startup_insight_fire1_agent.py | agno, firecrawl-py, openai, streamlit | No |
| 27 | ai_system_architect_r1 | ai_system_architect_r1.py | agno, anthropic, openai, streamlit | No |
| 28 | ai_teaching_agent_team | teaching_agent_team.py | agno, composio, composio-phidata, composio_core, duckduckgo-search, google-search-results, openai, streamlit, typing-extensions | Yes |
| 29 | ai_tic_tac_toe_agent | utils.py (entry: main logic in dir) | agno, altair, annotated-types, anthropic, anyio, attrs, blinker, build, cachetools, certifi... | No |
| 30 | devpulse_ai | streamlit_app.py | agno, feedparser, httpx, openai, streamlit | Yes |
| 31 | local_ai_legal_agent_team | local_ai_legal_agent_team/local_legal_agent.py | agno, ollama, qdrant-client, streamlit | No |
| 32 | multi_agent_researcher | research_agent.py | agno, openai, streamlit | Yes |
| 33 | multimodal_coding_agent_team | ai_coding_agent_o3.py | agno, e2b-code-interpreter, pillow, streamlit | Yes |
| 34 | multimodal_design_agent_team | design_agent_team.py | agno, duckduckgo-search, google-generativeai, pillow, streamlit | No |
| 35 | product_launch_intelligence_agent | product_launch_intelligence_agent.py | agno, firecrawl, streamlit | Yes |
| 36 | research_agent_gemini_interaction_api | research_planner_executor_agent.py | google-genai, streamlit | No |
| 37 | trust_gated_agent_team | trust_gated_agents.py | openai, streamlit | Yes |

**Notable:** 49% (18/37) use os.getenv for environment variables.

---

### 6. MCP_AI_AGENTS (4 apps)

All have requirements.txt. All 4 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | ai_travel_planner_mcp_agent_team | app.py | agno, google-search-results, icalendar, openai, streamlit | Yes |
| 2 | browser_mcp_agent | main.py | asyncio, mcp-agent, openai, streamlit | Yes |
| 3 | github_mcp_agent | github_agent.py | agno, asyncio, mcp, openai, streamlit | Yes |
| 4 | multi_mcp_agent_router | agent_forge.py | anthropic, mcp, pydantic, streamlit | Yes |

---

### 7. AI_AGENT_FRAMEWORK_CRASH_COURSE (12 apps)

11 of 12 have requirements.txt. None use st.secrets. 4 use os.getenv.

| # | Agent Name | Main File | Key Dependencies | os.getenv |
|---|-----------|-----------|-----------------|-----------|
| 1 | 1_starter_agent | app.py | openai-agents, python-dotenv, streamlit | Yes |
| 2 | 4_running_agents | agent_runner.py | openai-agents, python-dotenv, streamlit | No |
| 3 | 5_1_in_memory_conversation_agent | app.py | google-adk, python-dotenv, streamlit | No |
| 4 | 5_2_persistent_conversation_agent | app.py | google-adk, python-dotenv, sqlalchemy, streamlit | No |
| 5 | 6_1_agent_lifecycle_callbacks | app.py | google-adk, python-dotenv, streamlit | No |
| 6 | 6_2_llm_interaction_callbacks | app.py | google-adk, python-dotenv, streamlit | No |
| 7 | 6_3_tool_execution_callbacks | app.py | google-adk, python-dotenv, streamlit | No |
| 8 | 7_plugins | app.py | google-adk, google-genai, python-dotenv, streamlit | No |
| 9 | 7_sessions | streamlit_sessions_app.py | openai-agents, python-dotenv, streamlit | No |
| 10 | 9_1_sequential_agent | app.py | google-adk, pydantic, python-dotenv, streamlit | No |
| 11 | 9_2_loop_agent | app.py | *(no requirements.txt)* | No |
| 12 | 9_3_parallel_agent | app.py | google-adk, pydantic, python-dotenv, streamlit | No |

**Note:** `9_2_loop_agent` lacks a requirements.txt file.

---

### 8. AWESOME_AGENT_SKILLS (0 apps)

No Streamlit applications found in this category.

---

## Top 20 Dependencies Across All Apps

| Rank | Dependency | App Count |
|------|-----------|-----------|
| 1 | streamlit | 107 |
| 2 | agno | 47 |
| 3 | openai | 46 |
| 4 | python-dotenv | 28 |
| 5 | requests | 15 |
| 6 | pydantic | 15 |
| 7 | duckduckgo-search | 11 |
| 8 | qdrant-client | 11 |
| 9 | pandas | 10 |
| 10 | langchain-community | 10 |
| 11 | pillow | 9 |
| 12 | pypdf | 9 |
| 13 | ollama | 9 |
| 14 | google-adk | 9 |
| 15 | asyncio | 8 |
| 16 | firecrawl-py | 8 |
| 17 | openai-agents | 8 |
| 18 | numpy | 7 |
| 19 | langchain | 7 |
| 20 | anthropic | 7 |

**Insights:**
- Streamlit is almost universal (only 4 apps don't have it explicitly listed, likely inherited)
- Agno (phidata) is the most popular agent framework (42% of apps)
- OpenAI SDK is used in 41% of apps
- os.getenv pattern is in 39% of apps (43/111)
- st.secrets is rarely used (only 1 app: xai_finance_agent)
- **No apps have .streamlit/config.toml** (except one subdirectory component)

---

## Netlify Migration Readiness

### API Key Management
- **43 apps (38.7%)** use `os.getenv` - these will need environment variable configuration in Netlify
- **1 app (0.9%)** uses `st.secrets` - will need migration to `os.getenv` or Netlify's env var system
- **67 apps (60.4%)** don't appear to need API keys (or handle them differently)

### Configuration Files
- **110 of 111 apps (99.1%)** have requirements.txt - easy dependency capture
- **0 apps** have .streamlit/config.toml at the root (minimal Streamlit config to migrate)
- 1 app has config in `frontend/` subdirectory (ai_speech_trainer_agent)

### Project Structure Notes
- All apps follow standard pattern: `agent_name/` with `requirements.txt` and a main `.py` file
- Most main files are `app.py`, `main.py`, `streamlit_app.py`, or named after the agent
- Several multi-file apps have subdirectories (frontend, backend, rag, etc.) but the entry point is identifiable

### Recommended Migration Order (Easiest First)
1. **Starter AI Agents** (16) - All have requirements, simple structure, minimal dependencies
2. **Voice AI Agents** (3) - Small set, well-structured
3. **RAG Tutorials** (20) - All have requirements, but some have complex dependencies (databases, vector stores)
4. **MCP AI Agents** (4) - All well-structured, use os.getenv
5. **AI Framework Crash Course** (12) - Tutorial apps, likely simpler
6. **Advanced LLM Apps** (19) - Mixed complexity, some multi-file
7. **Advanced AI Agents** (37) - Largest category, varying complexity, many dependencies

---

## Full JSON Catalog

Complete catalog available at: `/workspaces/videoremix.vip2/streamlit_apps_catalog.json`

The JSON includes for each app:
- `main_file`: Path to the main Python file that imports streamlit
- `agent_path`: Root directory of the agent
- `has_requirements`: Boolean
- `dependencies`: List of package names from requirements.txt
- `uses_st_secrets`: Boolean
- `uses_os_getenv`: Boolean
- `has_streamlit_config`: Boolean

---

## End of Catalog
