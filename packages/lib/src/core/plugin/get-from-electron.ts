import type { VueDistributedLogger } from '@/core/utils';

export const getPluginFromMainProcess = async (
  channel: string,
  logger: VueDistributedLogger
): Promise<void> => {
  logger.error(
    `Electron loader is not implemented yet. Channel '${channel}' can not be handled.`
  );
};
