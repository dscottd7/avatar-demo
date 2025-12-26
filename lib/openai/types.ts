/**
 * OpenAI Realtime API Types
 * Based on OpenAI Realtime API documentation
 */

// Client events (sent to OpenAI)
export enum ClientEventType {
  SESSION_UPDATE = 'session.update',
  INPUT_AUDIO_BUFFER_APPEND = 'input_audio_buffer.append',
  INPUT_AUDIO_BUFFER_COMMIT = 'input_audio_buffer.commit',
  INPUT_AUDIO_BUFFER_CLEAR = 'input_audio_buffer.clear',
  CONVERSATION_ITEM_CREATE = 'conversation.item.create',
  RESPONSE_CREATE = 'response.create',
  RESPONSE_CANCEL = 'response.cancel',
}

// Server events (received from OpenAI)
export enum ServerEventType {
  ERROR = 'error',
  SESSION_CREATED = 'session.created',
  SESSION_UPDATED = 'session.updated',
  CONVERSATION_CREATED = 'conversation.created',
  INPUT_AUDIO_BUFFER_COMMITTED = 'input_audio_buffer.committed',
  INPUT_AUDIO_BUFFER_CLEARED = 'input_audio_buffer.cleared',
  INPUT_AUDIO_BUFFER_SPEECH_STARTED = 'input_audio_buffer.speech_started',
  INPUT_AUDIO_BUFFER_SPEECH_STOPPED = 'input_audio_buffer.speech_stopped',
  CONVERSATION_ITEM_CREATED = 'conversation.item.created',
  CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED = 'conversation.item.input_audio_transcription.completed',
  CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_FAILED = 'conversation.item.input_audio_transcription.failed',
  RESPONSE_CREATED = 'response.created',
  RESPONSE_DONE = 'response.done',
  RESPONSE_OUTPUT_ITEM_ADDED = 'response.output_item.added',
  RESPONSE_OUTPUT_ITEM_DONE = 'response.output_item.done',
  RESPONSE_CONTENT_PART_ADDED = 'response.content_part.added',
  RESPONSE_CONTENT_PART_DONE = 'response.content_part.done',
  RESPONSE_TEXT_DELTA = 'response.text.delta',
  RESPONSE_TEXT_DONE = 'response.text.done',
  RESPONSE_AUDIO_TRANSCRIPT_DELTA = 'response.audio_transcript.delta',
  RESPONSE_AUDIO_TRANSCRIPT_DONE = 'response.audio_transcript.done',
  RESPONSE_AUDIO_DELTA = 'response.audio.delta',
  RESPONSE_AUDIO_DONE = 'response.audio.done',
  RESPONSE_FUNCTION_CALL_ARGUMENTS_DELTA = 'response.function_call_arguments.delta',
  RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE = 'response.function_call_arguments.done',
  RATE_LIMITS_UPDATED = 'rate_limits.updated',
}

// Session configuration
export interface SessionConfig {
  modalities?: ('text' | 'audio')[];
  instructions?: string;
  voice?: 'alloy' | 'echo' | 'shimmer';
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  input_audio_transcription?: {
    model?: 'whisper-1';
  };
  turn_detection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
  tools?: Array<{
    type: 'function';
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  tool_choice?: 'auto' | 'none' | 'required';
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
}

// Message types
export interface ConversationItem {
  id?: string;
  type: 'message' | 'function_call' | 'function_call_output';
  status?: 'completed' | 'in_progress' | 'incomplete';
  role?: 'user' | 'assistant' | 'system';
  content?: Array<{
    type: 'input_text' | 'input_audio' | 'item_reference' | 'text' | 'audio';
    text?: string;
    audio?: string; // base64 encoded audio
    transcript?: string;
  }>;
}

// Event payload types
export interface SessionUpdateEvent {
  type: ClientEventType.SESSION_UPDATE;
  session: SessionConfig;
}

export interface InputAudioBufferAppendEvent {
  type: ClientEventType.INPUT_AUDIO_BUFFER_APPEND;
  audio: string; // base64 encoded PCM16 audio
}

export interface InputAudioBufferCommitEvent {
  type: ClientEventType.INPUT_AUDIO_BUFFER_COMMIT;
}

export interface ResponseCreateEvent {
  type: ClientEventType.RESPONSE_CREATE;
  response?: {
    modalities?: ('text' | 'audio')[];
    instructions?: string;
    voice?: 'alloy' | 'echo' | 'shimmer';
    output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    tools?: Array<any>;
    tool_choice?: string;
    temperature?: number;
    max_output_tokens?: number | 'inf';
  };
}

// Server event payloads
export interface ErrorEvent {
  type: ServerEventType.ERROR;
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
    event_id?: string;
  };
}

export interface SessionCreatedEvent {
  type: ServerEventType.SESSION_CREATED;
  session: {
    id: string;
    object: 'realtime.session';
    model: string;
    modalities: string[];
    instructions: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: any;
    turn_detection: any;
    tools: any[];
    tool_choice: string;
    temperature: number;
    max_response_output_tokens: number | 'inf';
  };
}

export interface ResponseAudioDeltaEvent {
  type: ServerEventType.RESPONSE_AUDIO_DELTA;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded audio chunk
}

export interface ResponseAudioTranscriptDeltaEvent {
  type: ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // partial transcript text
}

export interface ConversationItemCreatedEvent {
  type: ServerEventType.CONVERSATION_ITEM_CREATED;
  previous_item_id?: string;
  item: ConversationItem;
}

export interface InputAudioBufferSpeechStartedEvent {
  type: ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED;
  audio_start_ms: number;
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent {
  type: ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED;
  audio_end_ms: number;
  item_id: string;
}

export interface ResponseDoneEvent {
  type: ServerEventType.RESPONSE_DONE;
  response: {
    id: string;
    object: 'realtime.response';
    status: 'completed' | 'cancelled' | 'failed' | 'incomplete';
    status_details?: any;
    output: any[];
    usage?: {
      total_tokens: number;
      input_tokens: number;
      output_tokens: number;
    };
  };
}

// Union type for all server events
export type RealtimeServerEvent =
  | ErrorEvent
  | SessionCreatedEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioTranscriptDeltaEvent
  | ConversationItemCreatedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ResponseDoneEvent
  | { type: string; [key: string]: any }; // Catch-all for other events

// Union type for all client events
export type RealtimeClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | ResponseCreateEvent
  | { type: string; [key: string]: any }; // Catch-all for custom events
