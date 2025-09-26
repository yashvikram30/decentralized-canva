// AI prompts for various design tasks

export const DESIGN_PROMPTS = {
  ANALYZE_DESIGN: (canvasData: any) => `
    Analyze this design and provide constructive feedback on:
    - Visual hierarchy and layout
    - Color scheme and contrast
    - Typography and readability
    - Overall composition and balance
    - Areas for improvement
    
    Design data: ${JSON.stringify(canvasData, null, 2)}
  `,

  SUGGEST_IMPROVEMENTS: (description: string) => `
    Based on this design description: "${description}"
    Suggest 3-5 specific improvements focusing on:
    - Visual appeal
    - User experience
    - Modern design trends
    - Accessibility
  `,

  GENERATE_COLOR_PALETTE: (mood: string, style: string) => `
    Create a 5-color palette for a ${mood} ${style} design.
    Include:
    - Primary color (main brand color)
    - Secondary color (accent color)
    - Background color (light/neutral)
    - Text color (high contrast)
    - Accent color (highlight/CTA)
    
    Return as JSON array of hex colors.
  `,

  GENERATE_TEXT_CONTENT: (context: string, type: string) => `
    Generate ${type} text content for: ${context}
    Make it:
    - Engaging and professional
    - Appropriate for the target audience
    - Concise but informative
    - Brand-appropriate tone
  `,

  DESIGN_CRITIQUE: (canvasData: any) => `
    Provide a detailed design critique covering:
    1. Strengths of the current design
    2. Areas that need improvement
    3. Specific recommendations
    4. Modern design principles to apply
    5. Accessibility considerations
    
    Design: ${JSON.stringify(canvasData, null, 2)}
  `,

  SMART_SUGGESTIONS: (canvasData: any, userIntent: string) => `
    Based on the user's intent "${userIntent}" and current design:
    Suggest 3-5 smart improvements that would:
    - Align with the user's goals
    - Enhance the design's effectiveness
    - Follow current design best practices
    - Be easy to implement
    
    Current design: ${JSON.stringify(canvasData, null, 2)}
  `,
} as const;

export const IMAGE_PROMPTS = {
  GENERATE_ICON: (description: string, style: string) => `
    Create a ${style} icon for: ${description}
    Style: Clean, modern, minimal
    Format: Vector-style illustration
    Colors: Use a simple 2-3 color palette
  `,

  GENERATE_ILLUSTRATION: (theme: string, mood: string) => `
    Create an illustration with:
    Theme: ${theme}
    Mood: ${mood}
    Style: Modern, clean, professional
    Colors: Soft, harmonious palette
  `,

  GENERATE_PATTERN: (type: string, complexity: string) => `
    Generate a ${complexity} ${type} pattern that is:
    - Visually appealing
    - Not too busy or distracting
    - Suitable for background use
    - Modern and clean
  `,
} as const;

export const CONTENT_PROMPTS = {
  HEADLINE: (topic: string, tone: string) => `
    Write a compelling headline for: ${topic}
    Tone: ${tone}
    Length: 5-8 words
    Style: Attention-grabbing but professional
  `,

  BODY_TEXT: (topic: string, length: string) => `
    Write ${length} body text about: ${topic}
    Style: Clear, engaging, informative
    Tone: Professional but approachable
  `,

  CALL_TO_ACTION: (action: string, urgency: string) => `
    Create a ${urgency} call-to-action for: ${action}
    Style: Direct, compelling, action-oriented
    Length: 2-4 words
  `,
} as const;
