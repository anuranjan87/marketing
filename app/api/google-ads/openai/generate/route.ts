import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { campaignName, dailyBudget, websiteUrl } = await req.json();

    if (!campaignName || !dailyBudget) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and daily budget are required.' },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert Google Ads copywriter and keyword researcher.

Campaign name: "${campaignName}"
Daily budget: ₹${dailyBudget}
Website: ${websiteUrl || 'Not provided'}

Generate the following for a responsive search ad campaign:

1. A list of 5-8 relevant keywords (lowercase, comma-separated).
2. A list of 3-5 headlines (max 30 characters each).
3. A list of 2-4 descriptions (max 90 characters each).
4. A suggested ad group name (short, descriptive).

Return only valid JSON with keys: keywords (array), headlines (array), descriptions (array), adGroupName (string).
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a Google Ads specialist. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error('AI response was not valid JSON.');
    }

    return NextResponse.json({
      success: true,
      keywords: result.keywords || [],
      headlines: result.headlines || [],
      descriptions: result.descriptions || [],
      adGroupName: result.adGroupName || campaignName,
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'OpenAI generation failed.' },
      { status: 500 }
    );
  }
}