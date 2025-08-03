// Configuration for switching between adapters
export const ADAPTER_TYPE = process.env.ADAPTER_TYPE || 'fastify'; // 'fastify' or 'firebase'

export const isFirebaseAdapter = () => ADAPTER_TYPE === 'firebase';
export const isFastifyAdapter = () => ADAPTER_TYPE === 'fastify';
