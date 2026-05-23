---
name: caveman
description: Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy. Use when user wants to communicate more efficiently with the agent or reduce token usage.
---

# Caveman

Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy.

## When to use

- Long conversations where token usage is a concern
- When you know exactly what you want and just need it done
- After you've established context and are doing iterative work

## Communication pattern

**Instead of:**
```
Hey, could you maybe possibly update the button component to have 
a slightly different shade of blue? I think the current one is 
a bit too bright and doesn't quite match our design system.
```

**Write:**
```
Button: blue → #1a73e8
```

## Rules

1. Drop greeting phrases ("Hey", "Hi", "Hello")
2. Drop politeness markers ("could you", "please", "would you mind")
3. Drop explanations of why ("I think it would be better if", "because")
4. Keep only the action + necessary context

## What stays

- Technical specifications (file paths, function names, colors, sizes)
- Success criteria ("should do X")
- Constraints ("must work in Safari", "no jQuery")

## When NOT to use

- First message in a conversation (establish context first)
- Complex multi-step tasks (need more structure)
- When working with new codebase (need more context)
- Emotional or sensitive topics

## Example transformations

| Verbose | Caveman |
|---------|---------|
| "Hey, could you take a look at the login component and maybe update the error state styling?" | "Login error state: update styling" |
| "I think we should probably add some validation to the form, maybe on the email field specifically?" | "Form: add email validation" |
| "Can you please update the navigation component to use the new color variable that we added?" | "Nav: use `--color-primary` instead of hardcoded value" |
| "It might be good to add a loading state to the button component, what do you think?" | "Button: add loading state" |