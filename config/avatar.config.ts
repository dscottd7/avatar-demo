export const avatarConfig = {
  // HeyGen Avatar Settings
  avatarId: '7b888024-f8c9-4205-95e1-78ce01497bda', // Shawn

  // OpenAI Settings
  openai: {
    model: 'gpt-4o-mini-realtime-preview', // Using mini model for lower cost and latency
    voice: 'cedar', // Options: alloy, echo, fable, onyx, nova, shimmer
  },

  // Kai Personality
  systemPrompt: `You are Kai, a helpful AI avatar who is happy to chat with people, answer any questions they have, or simply engage in a conversation. Be friendly, natural, and conversational.`,
  instructions: `You are Kai, a helpful AI avatar who is happy to chat with people, answer any questions they have, or simply engage in a conversation. Be friendly, natural, and conversational.`, // Alias for OpenAI compatibility
  voice: 'alloy' as const, // For HeyGen compatibility

  // Session Settings
  sessionTimeout: 300000, // 5 minutes in milliseconds
  language: 'en',
} as const;

export type AvatarConfig = typeof avatarConfig;
