---
name: prototype
description: Build a throwaway prototype to flesh out a design — either a runnable terminal app for state/business-logic questions, or several radically different UI variations toggleable from one route. Use when user wants to prototype something, build a POC, try multiple approaches, or explore a design before committing.
---

# Prototype

Build a throwaway prototype to flesh out a design — either a runnable terminal app for state/business-logic questions, or several radically different UI variations toggleable from one route.

## Philosophy

Prototypes are **disposable**. The goal is to answer a specific question, not to ship production code. A good prototype:

1. Answers the question within 30 minutes
2. Can be thrown away without guilt
3. Doesn't get merged to main

**Ask first:** "What question does this prototype answer?" If you can't articulate the question, don't build the prototype.

## When to use

- User says "I want to prototype X" or "let's try a POC"
- You need to validate a design decision before committing
- Multiple approaches exist and it's unclear which will work
- You're about to make a significant architectural decision

## Types of prototypes

### Terminal prototype

For state/business-logic questions. Build a simple CLI that:
- Takes input (flags, stdin, prompts)
- Runs the logic
- Prints output

Example questions:
- "Will this algorithm work for our data?"
- "What's the right data model for X?"
- "How does this edge case behave?"

### UI prototype

For visual/UX questions. Build a page with:
- Toggle between approaches via URL param or UI control
- Minimal styling (Tailwind is fine)
- Hardcoded data

Example questions:
- "Should we use a drawer or modal for this flow?"
- "Does this work on mobile?"
- "Which layout is clearer?"

## Process

1. **State the question** — "This prototype will answer: [question]"
2. **Set a time budget** — "30 minutes max, then we're done"
3. **Build the simplest thing** — stub data, hardcoded values, no tests
4. **Show the user** — get feedback
5. **Iterate or stop** — if the question is answered, stop. If not, continue.
6. **Delete when done** — don't let prototypes accumulate

## Anti-patterns

- **Productionizing prototypes** — if you find yourself writing tests or documentation, you're done prototyping
- **Multiple questions per prototype** — answer one question at a time
- **Keeping prototypes around** — if you can't throw it away, it wasn't a prototype, it was a project

## Output

When presenting the prototype, always include:
- **What question it answers**
- **How to run it**
- **What to look for**
- **When to stop iterating**