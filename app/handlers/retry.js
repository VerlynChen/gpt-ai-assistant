import config from '../../config/index.js';
import { ROLE_AI } from '../../services/openai.js';
import { generateCompletion } from '../../utils/index.js';
import { COMMAND_BOT_CONTINUE, COMMAND_BOT_RETRY, GENERAL_COMMANDS } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_RETRY);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    updateHistory(context.id, (history) => history.erase());
    const prompt = getPrompt(context.userId);
    prompt.erase().write(ROLE_AI);
    try {
      const { text, isFinishReasonStop, threadId } = await generateCompletion({ 
        prompt,
        threadId: context.source.threadId,
      });
      prompt.patch(text);
      setPrompt(context.userId, prompt);
      updateHistory(context.id, (history) => history.write(config.BOT_NAME, text));
      // Update threadId in source
      if (threadId && threadId !== context.source.threadId) {
        context.source.threadId = threadId;
        const { updateSources } = await import('../repository/index.js');
        await updateSources(context.id, (source) => { source.threadId = threadId; });
      }
      const actions = isFinishReasonStop ? [] : [COMMAND_BOT_CONTINUE];
      context.pushText(text, actions);
    } catch (err) {
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
