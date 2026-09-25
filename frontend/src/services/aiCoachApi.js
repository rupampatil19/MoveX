// frontend/src/services/aiCoachApi.js
// Thin wrapper around the axios API client for AI Coach conversation endpoints.

import API from '../api';

/**
 * List all conversations for the current user (metadata only — no messages).
 * Sorted newest-first by updatedAt on the server.
 */
export async function listConversations() {
  const { data } = await API.get('/ai-coach/conversations');
  return data;
}

/**
 * Create a new empty conversation.
 * Returns the full conversation object with an empty messages array.
 */
export async function createConversation() {
  const { data } = await API.post('/ai-coach/conversations');
  return data;
}

/**
 * Fetch a single conversation with all its messages.
 */
export async function getConversation(conversationId) {
  const { data } = await API.get(`/ai-coach/conversations/${conversationId}`);
  return data;
}

/**
 * Send a user message to a conversation.
 * Backend persists the user message first, then calls the AI,
 * then persists the AI reply.
 *
 * Returns: { conversationId, title, userMessage, assistantMessage }
 *
 * On AI failure, the axios error will have
 *   err.response.data.userMessage
 * containing the already-saved user message, so the UI can show a retry button.
 */
export async function sendMessage(conversationId, message) {
  const { data } = await API.post(
    `/ai-coach/conversations/${conversationId}/messages`,
    { message }
  );
  return data;
}

/**
 * Delete a conversation and all its messages.
 * Ownership is enforced server-side.
 */
export async function deleteConversation(conversationId) {
  const { data } = await API.delete(`/ai-coach/conversations/${conversationId}`);
  return data;
}

/**
 * Rename a conversation.
 * Ownership is enforced server-side.
 * Returns the updated conversation metadata (without messages).
 */
export async function renameConversation(conversationId, title) {
  const { data } = await API.patch(
    `/ai-coach/conversations/${conversationId}`,
    { title }
  );
  return data;
}

/**
 * Get the current user's AI Coach context
 * (activities, stats, community, goals).
 */
export async function getCoachContext() {
  const { data } = await API.get('/ai-coach/context');
  return data;
}