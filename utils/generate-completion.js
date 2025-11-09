import config from '../config/index.js';
import { MOCK_TEXT_OK } from '../constants/mock.js';
import { 
  createThread,
  createThreadMessage,
  createThreadRun,
  retrieveThreadRun,
  listThreadMessages,
  FINISH_REASON_STOP,
  ROLE_HUMAN,
} from '../services/openai.js';

class Completion {
  text;

  finishReason;

  threadId;

  constructor({
    text,
    finishReason,
    threadId,
  }) {
    this.text = text;
    this.finishReason = finishReason;
    this.threadId = threadId;
  }

  get isFinishReasonStop() {
    return this.finishReason === FINISH_REASON_STOP;
  }
}

/**
 * Wait for the assistant run to complete
 * @param {string} threadId
 * @param {string} runId
 * @param {number} maxAttempts
 * @returns {Promise<Object>}
 */
const waitForRunCompletion = async (threadId, runId, maxAttempts = null) => {
  const startTime = Date.now();
  
  // Auto-adjust maxAttempts based on platform
  if (!maxAttempts) {
    if (config.VERCEL_ENV) {
      // Vercel: Limited by maxDuration (10s free, 60s pro)
      // Leave 3 seconds buffer for thread creation, message sending, and response retrieval
      maxAttempts = Math.max(5, config.VERCEL_MAX_DURATION - 3);
      console.log(`[Vercel] Waiting for completion (max ${maxAttempts} attempts)`);
    } else if (config.RENDER) {
      // Render: No timeout limit, can use longer wait time
      // This allows using any Assistant model and tools
      maxAttempts = 60;
      console.log(`[Render] Waiting for completion (max ${maxAttempts} attempts)`);
    } else {
      // Local development: 30 seconds default
      maxAttempts = 30;
      console.log(`[Local] Waiting for completion (max ${maxAttempts} attempts)`);
    }
  }
  
  // Use progressive polling intervals for better performance
  // Start with shorter intervals, then gradually increase
  const getPollingInterval = (attemptNumber) => {
    if (attemptNumber < 2) return 200; // First 2 checks: 200ms (更激進)
    if (attemptNumber < 5) return 300; // Next 3 checks: 300ms
    if (attemptNumber < 8) return 500; // Next 3 checks: 500ms
    return 1000; // After that: 1s
  };
  
  for (let i = 0; i < maxAttempts; i++) {
    const { data: run } = await retrieveThreadRun({ threadId, runId });
    
    // Completed successfully
    if (run.status === 'completed') {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[Assistant] Completed in ${elapsed}s after ${i + 1} attempts`);
      return run;
    }
    
    // Terminal failure states
    if (run.status === 'failed') {
      const errorMessage = run.last_error?.message || 'Unknown error';
      const errorCode = run.last_error?.code || 'unknown';
      throw new Error(`Assistant run failed [${errorCode}]: ${errorMessage}`);
    }
    
    if (run.status === 'cancelled') {
      throw new Error('Assistant run was cancelled');
    }
    
    if (run.status === 'expired') {
      throw new Error('Assistant run expired before completion');
    }
    
    // Incomplete state (API v2)
    if (run.status === 'incomplete') {
      const reason = run.incomplete_details?.reason || 'unknown';
      throw new Error(`Assistant run incomplete: ${reason}`);
    }
    
    // Requires action (function calling) - for future implementation
    if (run.status === 'requires_action') {
      // For now, we don't support function calling, so this is an error
      // In the future, you can implement function calling logic here
      throw new Error('Assistant requires action (function calling not yet implemented)');
    }
    
    // Still processing: queued, in_progress, cancelling
    // Use progressive polling interval
    const interval = getPollingInterval(i);
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  
  // Provide helpful error message based on platform
  if (config.VERCEL_ENV) {
    throw new Error(
      `Assistant 回應時間過長（超過 ${maxAttempts} 秒）。\n` +
      `Vercel 免費版限制較嚴格，建議：\n` +
      `1. 使用更快的模型（gpt-4o-mini）\n` +
      `2. 簡化 Instructions 和停用工具\n` +
      `3. 升級 Vercel Pro 或改用 Render 平台`
    );
  } else if (config.RENDER) {
    throw new Error(
      `Assistant 回應時間過長（超過 ${maxAttempts} 秒）。\n` +
      `這可能表示：\n` +
      `1. Assistant 遇到了問題\n` +
      `2. 任務太複雜（使用 Code Interpreter）\n` +
      `請檢查 OpenAI Platform 上的 Assistant 日誌。`
    );
  } else {
    throw new Error(`Assistant run timeout: No response after ${maxAttempts} seconds`);
  }
};

/**
 * @param {Object} param
 * @param {Prompt} param.prompt
 * @param {string} param.threadId - Existing thread ID (optional)
 * @returns {Promise<Completion>}
 */
const generateCompletion = async ({
  prompt,
  threadId = null,
}) => {
  if (config.APP_ENV !== 'production') {
    return new Completion({ text: MOCK_TEXT_OK, threadId: 'mock-thread-id' });
  }

  if (!config.OPENAI_ASSISTANT_ID) {
    throw new Error('OPENAI_ASSISTANT_ID is not configured');
  }

  try {
    // Create a new thread if not provided
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const { data: thread } = await createThread();
      currentThreadId = thread.id;
      console.log(`[Assistant] Created new thread: ${currentThreadId}`);
    }

    // Get the last user message from prompt
    // Note: In the old system, handlers often call write(ROLE_AI) with empty content
    // We need to find the actual user message (not the empty AI placeholder)
    let userMessage = null;
    
    // Search backwards for the last non-empty user message
    for (let i = prompt.messages.length - 1; i >= 0; i--) {
      const msg = prompt.messages[i];
      if (msg.role === ROLE_HUMAN && msg.content) {
        // Check if content is not just empty string or whitespace
        if (typeof msg.content === 'string' && msg.content.trim()) {
          userMessage = msg;
          break;
        } else if (Array.isArray(msg.content) && msg.content.length > 0) {
          // Image message
          userMessage = msg;
          break;
        }
      }
    }

    if (!userMessage || !userMessage.content) {
      throw new Error('No message content provided');
    }

    // Prepare content for Assistants API
    let messageContent;
    if (Array.isArray(userMessage.content)) {
      // Image message - extract text and image URL
      // For Assistants API, we need to convert the vision format
      const textPart = userMessage.content.find(item => item.type === 'text');
      const imagePart = userMessage.content.find(item => item.type === 'image_url');
      
      if (imagePart) {
        // Assistants API v2 supports image URLs in messages
        messageContent = userMessage.content;
      } else {
        messageContent = textPart?.text || 'Image';
      }
    } else {
      messageContent = userMessage.content;
    }

    // Add message to thread
    await createThreadMessage({
      threadId: currentThreadId,
      content: messageContent,
    });

    // Run the assistant
    const { data: run } = await createThreadRun({
      threadId: currentThreadId,
      assistantId: config.OPENAI_ASSISTANT_ID,
    });
    
    console.log(`[Assistant] Started run: ${run.id}`);

    // Wait for completion
    const completedRun = await waitForRunCompletion(currentThreadId, run.id);

    // Get the assistant's response
    const { data: messagesResponse } = await listThreadMessages({
      threadId: currentThreadId,
      limit: 1,
      order: 'desc',
    });

    const assistantMessage = messagesResponse.data[0];
    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      throw new Error('No response from assistant');
    }

    // Verify it's from the assistant
    if (assistantMessage.role !== 'assistant') {
      throw new Error('Expected assistant message but got: ' + assistantMessage.role);
    }

    // Extract text from the message content (v2 API format)
    const textContent = assistantMessage.content
      .filter((content) => content.type === 'text')
      .map((content) => {
        let text = content.text.value;
        
        // Handle annotations (file citations, file paths) - v2 API feature
        // Remove citation markers like 【4:0†source】 from the text
        if (content.text.annotations && content.text.annotations.length > 0) {
          content.text.annotations.forEach((annotation) => {
            // Remove the citation marker from text
            if (annotation.text) {
              text = text.replace(annotation.text, '');
            }
            
            // Optionally, you can add file reference info at the end
            // if (annotation.type === 'file_citation') {
            //   // Could add: "參考來源: filename"
            // }
          });
        }
        
        // Also remove any remaining citation patterns like 【...†...】
        text = text.replace(/【[^】]*†[^】]*】/g, '');
        
        // Remove any standalone citation markers like [1], [2], etc at the end
        text = text.replace(/\s*\[\d+\]\s*/g, ' ');
        
        // Clean up extra whitespace (but preserve line breaks for LINE formatting)
        // Replace multiple spaces (but not newlines) with single space
        text = text.replace(/[^\S\n]+/g, ' ');
        // Remove trailing spaces from each line
        text = text.replace(/[^\S\n]+$/gm, '');
        // Remove leading spaces from each line  
        text = text.replace(/^[^\S\n]+/gm, '');
        // Limit consecutive newlines to maximum 2 (one blank line)
        text = text.replace(/\n{3,}/g, '\n\n');
        // Trim overall text
        text = text.trim();
        
        return text;
      })
      .join('\n');

    if (!textContent.trim()) {
      throw new Error('Assistant response contained no text content');
    }

    return new Completion({
      text: textContent.trim(),
      finishReason: completedRun.status === 'completed' ? FINISH_REASON_STOP : completedRun.status,
      threadId: currentThreadId,
    });
  } catch (error) {
    // Enhanced error handling with more context
    console.error('[Assistant] Error:', error.message);
    
    // Provide user-friendly error messages
    if (error.message.includes('timeout') || error.message.includes('時間過長')) {
      throw error; // Already formatted
    }
    
    if (error.message.includes('rate_limit_exceeded')) {
      throw new Error('API 請求過於頻繁，請稍後再試。');
    }
    
    if (error.message.includes('invalid_api_key')) {
      throw new Error('API 金鑰無效，請檢查設定。');
    }
    
    // Re-throw with original message
    throw error;
  }
};

export default generateCompletion;
