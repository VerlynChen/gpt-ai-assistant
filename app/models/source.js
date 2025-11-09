import { t } from '../../locales/index.js';
import { SOURCE_TYPE_GROUP } from '../../services/line.js';

class Source {
  type;

  name;

  bot;

  threadId;

  conversationRounds;

  createdAt;

  constructor({
    type,
    name,
    bot,
    threadId = null,
    conversationRounds = 0,
  }) {
    this.type = type;
    this.name = name || (type === SOURCE_TYPE_GROUP ? t('__SOURCE_NAME_SOME_GROUP') : t('__SOURCE_NAME_SOMEONE'));
    this.bot = bot;
    this.threadId = threadId;
    this.conversationRounds = conversationRounds || 0;
    this.createdAt = Math.floor(Date.now() / 1000);
  }
}

export default Source;
