import config from '../../config/index.js';
import { t } from '../../locales/index.js';
import { ROLE_AI, ROLE_HUMAN } from '../../services/openai.js';
import { generateCompletion } from '../../utils/index.js';
import { COMMAND_BOT_CONTINUE, COMMAND_BOT_FORGET, COMMAND_BOT_TALK } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';
import { deleteThread } from '../../services/openai.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => (
  context.hasCommand(COMMAND_BOT_TALK)
  || context.hasBotName
  || context.source.bot.isActivated
);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    const prompt = getPrompt(context.userId);
    try {
      // Check if we need to reset the conversation due to round limit
      let currentThreadId = context.source.threadId;
      const maxRounds = config.APP_MAX_CONVERSATION_ROUNDS;
      
      if (maxRounds > 0 && context.source.conversationRounds >= maxRounds) {
        console.log(`[Conversation] Round limit reached (${maxRounds}), resetting thread...`);
        
        // Delete old thread from OpenAI
        if (currentThreadId && config.APP_ENV === 'production') {
          try {
            await deleteThread({ threadId: currentThreadId });
          } catch (err) {
            console.error('Failed to delete thread:', err.message);
          }
        }
        
        // Reset for new conversation
        currentThreadId = null;
        context.source.conversationRounds = 0;
      }
      
      if (context.event.isText) {
        prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.trimmedText}`).write(ROLE_AI);
      }
      if (context.event.isImage) {
        const { trimmedText } = context;
        prompt.writeImage(ROLE_HUMAN, trimmedText).write(ROLE_AI);
      }
      const { text, isFinishReasonStop, threadId } = await generateCompletion({ 
        prompt,
        threadId: currentThreadId,
      });
      prompt.patch(text);
      setPrompt(context.userId, prompt);
      updateHistory(context.id, (history) => history.write(config.BOT_NAME, text));
      
      // Increment conversation rounds
      context.source.conversationRounds = (context.source.conversationRounds || 0) + 1;
      console.log(`[Conversation] Round ${context.source.conversationRounds}${maxRounds > 0 ? `/${maxRounds}` : ''}`);
      
      // Update threadId and conversation rounds in source
      if (threadId !== context.source.threadId || context.source.conversationRounds > 0) {
        context.source.threadId = threadId;
        const { updateSources } = await import('../repository/index.js');
        await updateSources(context.id, (source) => { 
          source.threadId = threadId;
          source.conversationRounds = context.source.conversationRounds;
        });
      }
      const actions = [];  // 空陣列 = 不顯示按鈕
      context.pushText(text, actions);
    } catch (err) {
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
