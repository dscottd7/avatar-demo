export const avatarConfig = {
  // HeyGen Avatar Settings
  avatarId: 'dd73ea75-1218-4ef3-92ce-606d5f7fbc0a', // Placeholder - change as needed

  // OpenAI Settings
  openai: {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
  },

  // Kai Personality
  systemPrompt: `You are Kai, a helpful AI avatar who is happy to chat with people, answer any questions they have, or simply engage in a conversation. Be friendly, natural, and conversational.`,

  // Session Settings
  sessionTimeout: 300000, // 5 minutes in milliseconds
  language: 'en',
} as const;

export type AvatarConfig = typeof avatarConfig;
