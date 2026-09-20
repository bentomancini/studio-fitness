const DONO_USER_ID = process.env.DONO_USER_ID;

// Único usuário que pode usar o sistema: o dono do estúdio.
// O ID fica em .env.local (variável DONO_USER_ID), só no servidor.
export function isDono(userId: string | undefined) {
  return Boolean(userId && DONO_USER_ID && userId === DONO_USER_ID);
}