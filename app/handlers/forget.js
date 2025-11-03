import { COMMAND_BOT_FORGET } from '../commands/index.js';
import Context from '../context.js';
import { removeHistory } from '../history/index.js';
import { removePrompt } from '../prompt/index.js';
import { deleteThread } from '../../services/openai.js';
import config from '../../config/index.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_FORGET);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    removePrompt(context.userId);
    removeHistory(context.userId);
    
    // Delete the thread from OpenAI (v2 API best practice)
    if (context.source.threadId && config.APP_ENV === 'production') {
      try {
        await deleteThread({ threadId: context.source.threadId });
      } catch (err) {
        // Log error but don't fail the forget operation
        console.error('Failed to delete thread:', err.message);
      }
    }
    
    // Clear threadId to start a new thread on next conversation
    if (context.source.threadId) {
      context.source.threadId = null;
      const { updateSources } = await import('../repository/index.js');
      await updateSources(context.id, (source) => { source.threadId = null; });
    }
    
    context.pushText(COMMAND_BOT_FORGET.reply);
    return context;
  }
)();

export default exec;
