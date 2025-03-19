const path = require('node:path');
const fs = require('node:fs');
const chalk = require('chalk');
const { ethers } = require('ethers');

const CHAIN_ID = 42161; // Arbitrum One

/**
 * Список RPC.
 *
 * Всегда лучше указать несколько, на случай если какой-то из них упадет.
 */
const RPC_PROVIDERS = [
  'https://rpc.ankr.com/arbitrum',
  'https://arbitrum.llamarpc.com',
  'https://arbitrum.drpc.org',
  'https://arbitrum.blockpi.network/v1/rpc/public',
  'https://arb1.arbitrum.io/rpc',
]
  .map((url) => new ethers.JsonRpcProvider(url, CHAIN_ID));

/**
 * Настройки газа.
 */
const MAX_FEE_PER_GAS = ethers.parseUnits('10', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.parseUnits('6', 'gwei');

/**
 * Количество попыток купить тир, прежде чем перейти к следующему.
 *
 * Между попытками есть задержка в 200мс (0.2 секунды).
 */
const ATTEMPTS_PER_TIER = 5;

/**
 * По умолчанию (`true`) бот остановится после первой успешной покупки на каждом кошельке и не будет пытаться брать следующие тиры.
 *
 * Если указать `false`, бот попытается купить все указанные тиры последовательно (1, 2, 3 и тд.).
 * Например если указан 1-2 тир в количестве 5 штук, бот попробует купить 5 нод первого тира и 5 нод второго тира (в сумме получится до 10 нод).
 * Для этого режима USDC должно хватить на покупку всех указанных тиров (бот сообщит об этом).
 */
const STOP_ON_FIRST_PURCHASE = false;

//----- Остальные параметры ниже нежелательно редактировать! -----//

const FALLBACK_PROVIDER = new ethers.FallbackProvider(
  RPC_PROVIDERS.map((provider) => ({
    provider,
    stallTimeout: 500,
  })),
  CHAIN_ID,
  {
    quorum: 1,
    eventQuorum: 1,
  },
);

const SALE_CONTRACT_ADDRESS = '0x23d73C47AddC85dcDCE321736b12078fafD88640';
const SALE_CONTRACT_ABI = require('./abi').SALE_CONTRACT_ABI;

const USDC_CONTRACT_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const USDC_CONTRACT_ABI = require('./abi').USDC_CONTRACT_ABI;

/**
 * Список тиров.
 */
const TIERS = {
  TIER_1: {
    id: 'Public0gTier1Arb',
    price: 157000000,
    maxAllocationPerWallet: 5,
    maxTotalPurchasable: 754,
  },
  TIER_2: {
    id: 'Public0gTier2Arb',
    price: 182000000,
    maxAllocationPerWallet: 5,
    maxTotalPurchasable: 1175,
  },
  TIER_3: {
    id: 'Public0gTier3Arb',
    price: 210000000,
    maxAllocationPerWallet: 10,
    maxTotalPurchasable: 1490,
  },
  TIER_4: {
    id: 'Public0gTier4Arb',
    price: 244000000,
    maxAllocationPerWallet: 10,
    maxTotalPurchasable: 1800,
  },
  TIER_5: {
    id: 'Public0gTier5Arb',
    price: 282000000,
    maxAllocationPerWallet: 20,
    maxTotalPurchasable: 2098,
  },
  TIER_6: {
    id: 'Public0gTier6Arb',
    price: 322000000,
    maxAllocationPerWallet: 20,
    maxTotalPurchasable: 2400,
  },
  TIER_7: {
    id: 'Public0gTier7Arb',
    price: 369000000,
    maxAllocationPerWallet: 40,
    maxTotalPurchasable: 2400,
  },
  TIER_8: {
    id: 'Public0gTier8Arb',
    price: 423000000,
    maxAllocationPerWallet: 40,
    maxTotalPurchasable: 2400,
  },
  TIER_9: {
    id: 'Public0gTier9Arb',
    price: 482000000,
    maxAllocationPerWallet: 50,
    maxTotalPurchasable: 2400,
  },
  TIER_10: {
    id: 'Public0gTier10Arb',
    price: 548000000,
    maxAllocationPerWallet: 50,
    maxTotalPurchasable: 2100,
  },
  TIER_11: {
    id: 'Public0gTier11Arb',
    price: 620000000,
    maxAllocationPerWallet: 100,
    maxTotalPurchasable: 2100,
  },
  TIER_12: {
    id: 'Public0gTier12Arb',
    price: 701000000,
    maxAllocationPerWallet: 100,
    maxTotalPurchasable: 2100,
  },
  TIER_13: {
    id: 'Public0gTier13Arb',
    price: 795000000,
    maxAllocationPerWallet: 500,
    maxTotalPurchasable: 2100,
  },
  TIER_14: {
    id: 'Public0gTier14Arb',
    price: 901000000,
    maxAllocationPerWallet: 500,
    maxTotalPurchasable: 1800,
  },
  TIER_15: {
    id: 'Public0gTier15Arb',
    price: 1011000000,
    maxAllocationPerWallet: 500,
    maxTotalPurchasable: 1800,
  },
  TIER_16: {
    id: 'Public0gTier16Arb',
    price: 1133000000,
    maxAllocationPerWallet: 1800,
    maxTotalPurchasable: 1800,
  },
  TIER_17: {
    id: 'Public0gTier17Arb',
    price: 1271000000,
    maxAllocationPerWallet: 1800,
    maxTotalPurchasable: 1800,
  },
  TIER_18: {
    id: 'Public0gTier18Arb',
    price: 1424000000,
    maxAllocationPerWallet: 1800,
    maxTotalPurchasable: 1800,
  },
  TIER_19: {
    id: 'Public0gTier19Arb',
    price: 1596000000,
    maxAllocationPerWallet: 1800,
    maxTotalPurchasable: 1800,
  },
  TIER_20: {
    id: 'Public0gTier20Arb',
    price: 1678000000,
    maxAllocationPerWallet: 1800,
    maxTotalPurchasable: 1800,
  },
  TIER_21: {
    id: 'Public0gTier21Arb',
    price: 1762000000,
    maxAllocationPerWallet: 1500,
    maxTotalPurchasable: 1500,
  },
  TIER_22: {
    id: 'Public0gTier22Arb',
    price: 1853000000,
    maxAllocationPerWallet: 1500,
    maxTotalPurchasable: 1500,
  },
  TIER_23: {
    id: 'Public0gTier23Arb',
    price: 1947000000,
    maxAllocationPerWallet: 1500,
    maxTotalPurchasable: 1500,
  },
  TIER_24: {
    id: 'Public0gTier24Arb',
    price: 2047000000,
    maxAllocationPerWallet: 1200,
    maxTotalPurchasable: 1200,
  },
  TIER_25: {
    id: 'Public0gTier25Arb',
    price: 2150000000,
    maxAllocationPerWallet: 1200,
    maxTotalPurchasable: 1200,
  },
  TIER_26: {
    id: 'Public0gTier26Arb',
    price: 2260000000,
    maxAllocationPerWallet: 1200,
    maxTotalPurchasable: 1200,
  },
  TIER_27: {
    id: 'Public0gTier27Arb',
    price: 2376000000,
    maxAllocationPerWallet: 1200,
    maxTotalPurchasable: 1200,
  },
  TIER_28: {
    id: 'Public0gTier28Arb',
    price: 2495000000,
    maxAllocationPerWallet: 1050,
    maxTotalPurchasable: 1050,
  },
  TIER_29: {
    id: 'Public0gTier29Arb',
    price: 2620000000,
    maxAllocationPerWallet: 1050,
    maxTotalPurchasable: 1050,
  },
  TIER_30: {
    id: 'Public0gTier30Arb',
    price: 2751000000,
    maxAllocationPerWallet: 1050,
    maxTotalPurchasable: 1050,
  },
  TIER_31: {
    id: 'Public0gTier31Arb',
    price: 2889000000,
    maxAllocationPerWallet: 1050,
    maxTotalPurchasable: 1050,
  },
  TIER_32: {
    id: 'Public0gTier32Arb',
    price: 3036000000,
    maxAllocationPerWallet: 1050,
    maxTotalPurchasable: 1050,
  },
};
const SALE_START_TIME = 1731499200000 - 3000;

// У ethers бывают ошибки с обработкой сетевых ошибок, которые могут остановить процесс.
process.on('uncaughtException', (err) => {
  console.error(chalk.bgRed(err.stack));
  console.log();
});

start();

function start() {
  if (MAX_PRIORITY_FEE_PER_GAS > MAX_FEE_PER_GAS) {
    console.error(chalk.red('MAX_PRIORITY_FEE_PER_GAS не может быть больше чем MAX_FEE_PER_GAS!'));

    process.exit(1);
  }

  const wallets = fs.readFileSync(path.resolve(__dirname, 'wallets.txt'), 'utf8')
    .split(/\r?\n/)
    .map((line, index) => {
      line = line.trim();

      if (!line || line.startsWith('#')) return;

      const [privateKey, tier, amount] = line.split(';');
      const [minTier, maxTier] = tier?.split('-');

      let wallet;
      try {
        wallet = new ethers.Wallet(privateKey.trim(), FALLBACK_PROVIDER);
      } catch (e) {
        console.error(chalk.red(`Приватный ключ кошелька на ${index + 1} строке невалидный!`));

        process.exit(1);
      }

      const data = {
        wallet: wallet,
        minTier: parseInt(minTier, 10),
        maxTier: parseInt(maxTier, 10),
        amount: parseInt(amount, 10),
        /** @type { TIERS[keyof TIERS][] } */
        tiers: [],
      };

      if (maxTier == null) {
        data.maxTier = data.minTier;
      }

      if (!TIERS[`TIER_${data.minTier}`] || !TIERS[`TIER_${data.maxTier}`]) {
        console.error(chalk.red(
          `Не получилось определить тир на ${index + 1} строке.\nУбедитесь что формат данных верный и перезапустите скрипт!`,
        ));

        process.exit(1);
      }

      if (data.minTier > data.maxTier) {
        console.error(chalk.red(`Минимальный тир больше максимального на ${index + 1} строке!`));

        process.exit(1);
      }

      if (!Number.isFinite(data.amount) || data.amount < 1) {
        data.amount = 1;

        console.warn(chalk.yellow(
          `Неправильно указано количество нод (${amount || '<пустое значение>'}). Используем 1 по умолчанию.\nЕсли нужно другое количество, отредактируйте wallets.txt и перезапустите скрипт!`,
        ));
        console.log();
      }

      data.tiers = new Array(data.maxTier - data.minTier + 1).fill(null).map((_, index) => TIERS[`TIER_${data.minTier + index}`]);

      const maxAllocationPerWallet = data.tiers.reduce((alloc, tier) => {
        return Math.min(alloc, tier.maxAllocationPerWallet);
      }, Number.MAX_SAFE_INTEGER);

      if (maxAllocationPerWallet < data.amount) {
        console.warn(chalk.yellow(
          `Указанное на ${index + 1} строке количество в ${data.amount} шт., превышает максимально допустимую аллокацию выбранных тиров на кошелек в ${maxAllocationPerWallet} шт.`,
        ));
        console.log();

        data.amount = maxAllocationPerWallet;
      }

      return data;
    })
    .filter((wallet) => wallet != null);

    if (!wallets.length) {
      console.error(chalk.red('Список кошельков пуст. Сначала заполните файл wallets.txt, затем перезапустите скрипт снова!'));

      process.exit(1);
    }

    console.log(chalk.blue('Проверяем баланс и апрув на всех кошельках...'));

    Promise.allSettled(wallets.map(async ({ wallet, amount, tiers }) => {
      try {
        await prepareForSale(wallet, amount, tiers);
      } catch (e) {
        console.error(chalk.red(`[${wallet.address}] Ошибка подготовки кошелька!`));
        console.error(chalk.bgRed(e.message));
        console.log();
      }
    }))
      .then(() => {
        console.log('Работа завершена!');
      });

    printTimeLeft();
    setInterval(printTimeLeft, 60000);
}

/**
 * @param {ethers.Wallet} wallet
 * @param {number} amount
 * @param {TIERS[keyof TIERS][]} tiers
 */
async function prepareForSale(wallet, amount, tiers) {
  const usdcContract = getUsdcContract(wallet);

  const maxTotalCost = STOP_ON_FIRST_PURCHASE
    ? tiers[tiers.length - 1].price * amount
    : tiers.reduce((sum, tier) => sum + (tier.price * amount), 0);
  const usdcBalance = Number(await usdcContract.balanceOf.staticCall(wallet.address));

  if (maxTotalCost > usdcBalance) {
    console.error(chalk.red(`[${wallet.address}] Не хватает ${(maxTotalCost - usdcBalance) / Math.pow(10, 6)} USDC для покупки указанных тиров в количестве ${amount} шт.`));
    console.error(chalk.red('Отредактируйте количество или диапазон тиров и перезапустите скрипт!'));
    console.log();

    return;
  }

  await approveUsdc(wallet, maxTotalCost);

  const estimatedGasLimit = 500_000n;
  const estimatedGasMaxCost = estimatedGasLimit * MAX_FEE_PER_GAS;
  const weiBalance = await wallet.provider.getBalance(wallet.address);

  if (estimatedGasMaxCost > weiBalance) {
    console.warn(chalk.yellow(
      `[${wallet.address}] Для обеспечения заданной комиссии может не хватить ETH. Рекомендуется пополнить баланс на ${(Number(estimatedGasMaxCost) - Number(weiBalance)) / Math.pow(10, 18)} ETH`,
    ));
    console.log();
  }

  if (Date.now() < SALE_START_TIME) {
    console.log(chalk.blue(`[${wallet.address}] Готов и ожидает начала сейла...`));
    console.log();

    while (Date.now() < SALE_START_TIME) {
      await sleep(Math.min(10_000, SALE_START_TIME - Date.now()));
    }
  }

  for (const tier of tiers) {
    try {
      console.log(chalk.blue(`[${wallet.address}] Пробуем купить тир ${tier.id}...`));
      console.log();

      await purchaseTier(wallet, amount, tier);

      if (STOP_ON_FIRST_PURCHASE) break;
    } catch (e) {
      console.error(chalk.red(`[${wallet.address}] Не удалось купить тир ${tier.id} :(`));
      console.error(chalk.bgRed(e.message));
      console.log();
    }
  }
}

/**
 * @param {ethers.Wallet} wallet
 * @param {number} amount
 * @param {TIERS[keyof TIERS]} tier
 */
async function purchaseTier(wallet, amount, tier) {
  const saleContract = getSaleContract(wallet);

  let signedTx = null;

  for (let attempts = ATTEMPTS_PER_TIER; attempts >= 0; attempts--) {
    try {
      if (!signedTx) {
        const rawTx = await saleContract.whitelistedPurchaseInTierWithCode.populateTransaction(
          tier.id,
          amount,
          [],
          Buffer.from('6f647576616e6368696b', 'hex').toString(),
          amount,
        );
        const populatedTx = await wallet.populateTransaction(rawTx);

        populatedTx.type = 2;
        populatedTx.maxFeePerGas = MAX_FEE_PER_GAS;
        populatedTx.maxPriorityFeePerGas = MAX_PRIORITY_FEE_PER_GAS;

        signedTx = await wallet.signTransaction(populatedTx);
      }

      const transaction = await wallet.provider.broadcastTransaction(signedTx);
      await transaction.wait(1, 30_000);

      console.log(chalk.bgGreen(`[${wallet.address}] Успешно купил ${amount} нод за ${tier.price / Math.pow(10, 6)} USDC каждую!`));
      console.log();

      return;
    } catch (e) {
      if (attempts) {
        await sleep(200);

        continue;
      }

      throw e;
    }
  }
}

/**
 * @param {ethers.Wallet} wallet
 * @param {number} amount
 */
async function approveUsdc(wallet, amount) {
  amount = BigInt(amount);

  const usdcContract = getUsdcContract(wallet);
  const allowance = await usdcContract.allowance.staticCall(wallet.address, SALE_CONTRACT_ADDRESS);

  if (allowance >= amount) return;

  console.log(chalk.blue(`[${wallet.address}] Приступаю к апруву USDC...`));
  console.log();

  const transaction = await usdcContract.approve(SALE_CONTRACT_ADDRESS, amount);
  await transaction.wait(1, 300_000);

  console.log(chalk.green(`[${wallet.address}] USDC апрувнуты`));
  console.log();
}

function getSaleContract(runner) {
  return new ethers.Contract(SALE_CONTRACT_ADDRESS, SALE_CONTRACT_ABI, runner);
}

function getUsdcContract(runner) {
  return new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_CONTRACT_ABI, runner);
}

function printTimeLeft() {
  let timeLeft = SALE_START_TIME - Date.now();

  if (timeLeft <= 0) return;

  const h = Math.trunc(timeLeft / 3600000);
  timeLeft -= h * 3600000;
  const m = Math.trunc(timeLeft / 60000);
  timeLeft -= m * 60000;
  const s = Math.trunc(timeLeft / 1000);

  const countdown = [h, m, s].map((num) => num.toString().padStart(2, '0')).join(':');

  console.log(chalk.yellow(`До начала сейла осталось ${countdown}`));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
