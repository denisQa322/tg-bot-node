const { Telegraf, Markup } = require('telegraf');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_API_KEY);

// Объект для хранения времени последнего взаимодействия пользователей
const userLastInteraction = {};

// Функция для проверки, прошло ли больше 24 часов
function hasOneDayPassed(lastInteraction) {
  if (!lastInteraction) return true; // Если времени нет, значит сутки прошли
  const now = Date.now();
  return now - lastInteraction >= 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
}

// Функция создания клавиатуры с несколькими кнопками
function questionsKeyboard(questions) {
  return Markup.keyboard(questions)
    .resize() // Устанавливаем автоподстройку
    .oneTime(); // Клавиатура исчезнет после использования
}

// Функция создания клавиатуры с кнопками остались ли вопросы и возвратом в начало
function ussualKeyboard() {
  return Markup.keyboard([['Остались вопросы', 'Вернуться в начало']])
    .resize()
    .oneTime();
}

// Функция создания клавиатуры с выбором типа клиента
function customerKeyboard() {
  return Markup.keyboard([
    ['Розничный клиент', 'Оптовый клиент'],
    ['Клиент EMEX.RU', 'Хочу стать поставщиком'],
  ])
    .resize()
    .oneTime();
}

// Функция для отправки ошибки админу
async function sendErrorToAdmin(error) {
  try {
    await bot.telegram.sendMessage(
      process.env.ADMIN_ID,
      `❗️ Произошла ошибка в боте:\n\n${error.message}\n\n${error.stack}`,
    );
  } catch (err) {
    console.error('Не удалось отправить сообщение об ошибке в Telegram:', err);
  }
}

// Функция для обработки ошибки
async function handleError(ctx, error, context = 'Произошла ошибка') {
  console.error(`${context}:`, error);

  try {
    await sendErrorToAdmin(error); // Уведомляем администратора, если нужно
  } catch (adminError) {
    console.error('Ошибка при уведомлении администратора:', adminError);
  }

  await ctx.reply('Произошла ошибка, попробуйте снова позже.');
}

// Обработчик команды /start
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;

    // Проверяем, прошло ли больше 24 часов
    if (!hasOneDayPassed(userLastInteraction[userId])) {
      ctx.reply('Чем мы можем помочь?');
      return;
    }

    // Сохраняем текущее время взаимодействия
    userLastInteraction[userId] = Date.now();

    ctx.reply(
      'Здравствуйте!\nВы обратились к боту службы поддержки пользователей Leonet',
    );

    setTimeout(() => {
      ctx.reply('Выберите, к какому типу клиентов Вы относитесь:', customerKeyboard());
    }, 1000);
  } catch (error) {
    await sendErrorToAdmin(error);
    ctx.reply('Произошла ошибка, попробуйте снова позже.');
  }
});

// Обработчик выбора "Розничный клиент"
bot.hears(['Розничный клиент'], async (ctx) => {
  try {
    const retailQuestions = questionsKeyboard([
      ['Как оформить заказ?', 'Как пополнить баланс?'],
      ['Как узнать какой выбран ПВЗ?', 'Как узнать текущий статус заказа?'],
      ['Есть ли запчасть в наличии?', 'Как оформить возврат запчасти?'],
      ['Вопроса нет в предложенных', 'Вернуться назад'],
    ]);

    ctx.reply('Выберите один из Ваших вопросов:', retailQuestions);
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при обработке выбора "Розничный клиент"');
  }
});

// Обработчик выбора "Оптовый клиент"
bot.hears(['Оптовый клиент'], async (ctx) => {
  try {
    const wholeQuestions = questionsKeyboard([
      ['Как оформить заказ?', 'Как пополнить баланс?'],
      ['Как узнать текущий статус заказа?', 'Как оформить возврат запчасти?'],
      ['Вопроса нет в предложенных', 'Вернуться назад'],
    ]);

    ctx.reply('Выберите один из Ваших вопросов:', wholeQuestions);
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при обработке выбора "Оптовый клиент"');
  }
});

// Обработчик выбора "Клиент EMEX.RU"
bot.hears(['Клиент EMEX.RU'], async (ctx) => {
  try {
    ctx.reply(
      'Напишите пожалуйста Ваш вопрос как можно подробнее и полностью, первый свободный сотрудник свяжется с Вами для решения Вашего вопроса. \nСпасибо за ожидание!',
    );
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при обработке выбора "Клиент EMEX.RU"');
  }
});

// Обработчик выбора "Хочу стать поставщиком"
bot.hears(['Хочу стать поставщиком'], async (ctx) => {
  try {
    ctx.reply([
      'Укажите пожалуйста Ваши ФИО, контактный номер телефона и название Вашей организации, первый освободившийся сотрудник примет Ваши данные и передаст их ответственному лицу',
    ]);
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при обработке выбора "Хочу стать поставщиком"');
  }
});

// Как оформить заказ
bot.hears('Как оформить заказ?', async (ctx) => {
  try {
    const orderKeyboard = questionsKeyboard([
      ['Как пополнить баланс?'],
      ['Остались вопросы', 'Вернуться в начало'],
    ]);

    ctx.reply(
      'Информация о том, как оформить заказ: \n\nЧтобы оформить заказ на сайте Вам нужно:\n1.Пройти регистрацию на сайте. \n2.Найти интересующую Вас деталь по артикулу, либо по схеме добавив Ваше ТС (транспортное средство) по VIN или FRAME коду. \n3.Добавить нужную Вам деталь в корзину.\n4.Пополнить Ваш баланс на сайте одним из вариантов оплаты.\n5.Выбрать нужный вам пункт выдачи. \n6.Оформить заказ и наблюдать за его статусом.',
      orderKeyboard,
    );
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при обработке выбора "Как оформить заказ?"');
  }
});

// Как пополнить баланс
bot.hears('Как пополнить баланс?', async (ctx) => {
  try {
    const imageOne = path.join('images', 'balance-1.png');
    const imageTwo = path.join('images', 'balance-2.jpg');
    const imageThree = path.join('images', 'balance-3.jpg');
    const imageFour = path.join('images', 'balance-4.jpg');

    await ctx.reply(
      'Информацию о том, как пополнить Ваш баланс Вы можете узнать войдя в Ваш кошелек на сайте.\n\nВерсия для компьютера - 1ый и 2ой скриншоты. \n\nВерсия для мобильного устройства - 3ий и 4ый скриншоты.',
      ussualKeyboard(),
    );

    await ctx.replyWithPhoto({ source: imageOne });
    await ctx.replyWithPhoto({ source: imageTwo });
    await ctx.replyWithPhoto({ source: imageThree });
    await ctx.replyWithPhoto({ source: imageFour });
  } catch (error) {
    await handleError(ctx, error, 'Ошибка при обработке выбора "Как пополнить баланс?"');
  }
});

// Как узнать ПВЗ
bot.hears('Как узнать какой выбран ПВЗ?', async (ctx) => {
  try {
    const pvzImageOne = path.join('images', 'pvz-1.jpg');
    const pvzImageTwo = path.join('images', 'pvz-2.jpg');
    const pvzImageThree = path.join('images', 'pvz-3.jpg');

    ctx.reply(
      "Вы можете узнать информацию о ПВЗ нажав на иконку магазина справа от города, под Вашим ID, при авторизации на сайте с компьютера (1ый скриншот).\n\nС телефона для просмотра информации о ПВЗ Вы можете нажать на иконку меню слева вверху, затем нажать на 'Ваш пункт выдачи заказов' (2ой и 3ий скриншот).",
      ussualKeyboard(),
    );

    await ctx.replyWithPhoto({ source: pvzImageOne });
    await ctx.replyWithPhoto({ source: pvzImageTwo });
    await ctx.replyWithPhoto({ source: pvzImageThree });
  } catch (error) {
    await handleError(
      ctx,
      error,
      'Ошибка при обработке выбора "Как узнать какой выбран ПВЗ?"',
    );
  }
});

// Как узнать статус заказа
bot.hears('Как узнать текущий статус заказа?', async (ctx) => {
  try {
    ctx.reply(
      'Чтобы получить информацию о текущем статусе Вашего заказа при авторизации с компьютера вам нужно войти в историю в отслеживании, нажать на "i" в начале строки с заказом затем нажать на "Промежуточные статусы заказа", так вы сможете узнать текущий статус вашего заказа.\n\n При авторизации с телефона вам нужно войти во вкладку "Заказы" (вторая слева внизу) и войти в карточку с заказом, далее нужно нажать на "Путь заказа" - последний указанный статус является актуальным для Вашего заказа',
      ussualKeyboard(),
    );
  } catch (error) {
    await handleError(
      ctx,
      error,
      'Ошибка при обработке выбора "Как узнать текущий статус заказа?"',
    );
  }
});

// Есть ли деталь в наличии
bot.hears('Есть ли запчасть в наличии?', async (ctx) => {
  try {
    ctx.reply(
      'У нас не имеется запчастей в наличии, так как мы интернет-магазин, Вы можете самостоятельно проверить наличие на сайте и оформить заказ.\n\nДля этого Вам нужно:\n1. Найти интересующую Вас деталь по артикулу, либо по схеме добавив Ваше ТС (транспортное средство) по VIN или FRAME коду\n2.Добавить нужную Вам деталь в корзину.\n3.Пополнить Ваш баланс на сайте одним из вариантов оплаты.\n4.Выбрать нужный вам пункт выдачи\n5.Оформить заказ и наблюдать за его статусом.',
      ussualKeyboard(),
    );
  } catch (error) {
    await handleError(
      ctx,
      error,
      'Ошибка при обработке выбора "Есть ли запчасть в наличии?"',
    );
  }
});

// Как оформить возврат
bot.hears('Как оформить возврат запчасти?', async (ctx) => {
  try {
    ctx.reply(
      'Чтобы оформить возврат Вам нужно написать в данный чат референс Вашего заказа и указать причину возврата детали, первый свободный сотрудник свяжется с Вами для решения Вашего вопроса. \n\nСпасибо за ожидание',
    );
  } catch (error) {
    await handleError(
      ctx,
      error,
      'Ошибка при обработке выбора "Как оформить возврат запчасти?"',
    );
  }
});

// Обработчик "Вернуться назад"
bot.hears(['Вернуться назад', 'Вернуться в начало'], async (ctx) => {
  try {
    ctx.reply('Выберите, к какому типу клиентов Вы относитесь:', customerKeyboard());
  } catch (error) {
    await handleError(
      ctx,
      error,
      'Ошибка при обработке выбора "Вернуться назад, Вернуться в начало"',
    );
  }
});

// Обработчик "Остались вопросы" и "Вопроса нет в предложенных"
bot.hears(['Остались вопросы', 'Вопроса нет в предложенных'], async (ctx) => {
  try {
    ctx.reply(
      'Напишите пожалуйста Ваш вопрос на который я не смог помочь найти ответ как можно подробнее и полностью, первый свободный сотрудник свяжется с Вами для решения Вашего вопроса. \n\nСпасибо за ожидание!',
    );
  } catch (error) {
    await handleError(
      ctx,
      error,
      'Ошибка при обработке выбора "Остались вопросы, Вопроса нет в предложенных"',
    );
  }
});

// Глобальный обработчик ошибок
bot.catch(async (err) => {
  console.error('Произошла непредвиденная ошибка:', err);
  await sendErrorToAdmin(err);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));