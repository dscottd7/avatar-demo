export const avatarConfig = {
  // HeyGen Avatar Settings
  avatarId: '200eba85-74c0-4210-8670-81ceab4efd0d', // Pedro suit

  // OpenAI Settings
  openai: {
    model: 'gpt-4o-mini-realtime-preview', // Using mini model for lower cost and latency
    voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
  },

  // Kai Personality
  systemPrompt: `You are Kai, a helpful AI avatar who is happy to chat with people, answer any questions they have, or simply engage in a conversation. Be friendly, natural, and conversational.`,

  // Session Settings
  sessionTimeout: 300000, // 5 minutes in milliseconds
  language: 'en',
} as const;

export type AvatarConfig = typeof avatarConfig;
