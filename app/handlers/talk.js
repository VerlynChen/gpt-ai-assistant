import config from '../../config/index.js';
import { t } from '../../locales/index.js';
import { ROLE_AI, ROLE_HUMAN } from '../../services/openai.js';
import { generateCompletion } from '../../utils/index.js';
import { COMMAND_BOT_CONTINUE, COMMAND_BOT_FORGET, COMMAND_BOT_TALK } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { getPrompt, setPrompt } from '../prompt/index.js';

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
      if (context.event.isText) {
        prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.trimmedText}`).write(ROLE_AI);
      }
      if (context.event.isImage) {
        const { trimmedText } = context;
        prompt.writeImage(ROLE_HUMAN, trimmedText).write(ROLE_AI);
      }
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
      const actions = [];  // 空陣列 = 不顯示按鈕
      context.pushText(text, actions);
    } catch (err) {
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
