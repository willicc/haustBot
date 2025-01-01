import axios from 'axios';
import fs from 'fs/promises';
import log from "./utils/logger.js";
import iniBapakBudi from "./utils/banner.js";

export async function readWallets() {
    try {
        await fs.access("wallets.json");

        const data = await fs.readFile("wallets.json", "utf-8");
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            log.info("No wallets found in wallets.json");
            return [];
        }
        throw err;
    }
}

const claimFaucet = async (address) => {
    let attempt = 0;
    const maxRetries = 5;

    while (attempt < maxRetries) {
        try {
            const response = await axios.post(
                'https://faucet-test.haust.network/api/claim',
                { address },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            log.info(`Claim successful:`, response.data);
            return;
        } catch (error) {
            attempt++;
            log.error(`Error claiming faucet:`, error.message);

            if (attempt < maxRetries) {
                log.warn(`Retrying in 10 seconds... Attempt ${attempt} of ${maxRetries}`);
                await new Promise((resolve) => setTimeout(resolve, 10000));
            } else {
                log.error(`Max retries reached for ${address}. Skipping.`);
            }
        }
    }
};

const main = async () => {
    log.info(iniBapakBudi);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const wallets = await readWallets();

    if (wallets.length === 0) {
        log.warn("No wallets to process.");
        return;
    }

    for (const wallet of wallets) {
        log.info(`Processing wallet: ${wallet.address}`);
        await claimFaucet(wallet.address);
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000)); // 10 seconds delay
    }
};

main();
