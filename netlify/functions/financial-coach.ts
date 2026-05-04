import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

interface FinancialAnalysis {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  categories: BudgetCategory[];
  recommendations: Recommendation[];
  emergencyFundMonths: number;
  savingsRate: number;
}

interface BudgetCategory {
  category: string;
  amount: number;
  percentage: number;
  isEssential: boolean;
}

interface Recommendation {
  category: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
}

async function analyzeBudget(transactions: Transaction[]): Promise<{
  analysis: FinancialAnalysis;
  recommendations: Recommendation[];
}> {
  // Group by category
  const expensesByCategory = new Map<string, number>();
  let totalExpenses = 0;
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
      totalExpenses += t.amount;
    });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Categorize as essential vs discretionary
  const essentialCategories = ['Housing', 'Utilities', 'Groceries', 'Healthcare', 'Insurance', 'Transportation', 'Minimum Debt'];
  
  const categories: BudgetCategory[] = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      isEssential: essentialCategories.includes(category) || category.toLowerCase().includes('rent') || category.toLowerCase().includes('mortgage')
    }))
    .sort((a, b) => b.amount - a.amount);

  // Build prompt for AI recommendations
  const transactionSummary = transactions
    .filter(t => t.type === 'expense')
    .map(t => `${t.category}: $${t.amount.toFixed(2)}`)
    .join('\n');

  const prompt = `You are a professional financial advisor. Analyze this spending data and provide actionable recommendations.

Monthly Income: $${totalIncome.toFixed(2)}
Monthly Expenses: $${totalExpenses.toFixed(2)}
Net Cash Flow: ${(totalIncome - totalExpenses).toFixed(2)}

Expenses by Category:
${transactionSummary}

Provide 4-5 specific recommendations to improve the user's financial health. For each recommendation, include:
1. Category focus (e.g., "Dining Out", "Subscriptions")
2. Specific actionable advice
3. Estimated monthly savings amount (realistic)
4. Priority level: "high", "medium", or "low"

Consider:
- Housing costs should be <30% of income
- Food should be 10-15%
- Transportation 10-15%
- Savings should be at least 20% of income
- Look for subscriptions, dining, entertainment as common areas to cut

Respond in valid JSON format:
{
  "recommendations": [
    {
      "category": "Dining Out",
      "description": "Reduce restaurants from 4x to 2x per week",
      "potentialSavings": 300,
      "priority": "high"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a certified financial planner. Provide concise, actionable advice with specific numbers. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content?.trim() || '{"recommendations": []}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    
    const aiData = JSON.parse(jsonStr);
    
    return {
      analysis: {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        categories,
        emergencyFundMonths: Math.max(0, Math.round((totalExpenses * 3) / 1000) * 3), // Simplified: 3-6 months of expenses
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      },
      recommendations: aiData.recommendations || []
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    // Fallback simple recommendations
    const fallbackRecs: Recommendation[] = [];
    if (totalExpenses > totalIncome * 0.9) {
      fallbackRecs.push({
        category: 'Overall Spending',
        description: 'Your expenses are very high relative to income. Review all categories and look for reductions.',
        potentialSavings: totalExpenses * 0.1,
        priority: 'high'
      });
    }
    
    return {
      analysis: {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        categories,
        emergencyFundMonths: 3,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      },
      recommendations: fallbackRecs
    };
  }
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { transactions, userId } = JSON.parse(event.body);

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Valid transactions array is required' })
      };
    }

    // Analyze finances
    const { analysis, recommendations } = await analyzeBudget(transactions);

    // Log to database
    try {
      await supabase
        .from('ai_agent_runs')
        .insert({
          agent_type: 'financial_coach',
          user_id: userId || null,
          input_data: { transactionCount: transactions.length },
          output_data: { analysis, recommendations },
          status: 'completed',
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return { statusCode: 200, body: JSON.stringify({ analysis, recommendations }) };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}
