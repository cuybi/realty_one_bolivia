/**
 * MongoDB Auth State adapter para Baileys.
 * Reemplaza useMultiFileAuthState (disco) por MongoDB (nube persistente).
 * Sesión sobrevive reinicios de Render.
 * ponytail: mínimo necesario — sin abstracciones extra.
 */

const { proto, initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

async function useMongoAuthState(collection) {
  const read = async (id) => {
    const doc = await collection.findOne({ _id: id });
    if (!doc?.data) return null;
    return JSON.parse(JSON.stringify(doc.data), BufferJSON.reviver);
  };

  const write = async (data, id) => {
    await collection.updateOne(
      { _id: id },
      { $set: { data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)), updatedAt: new Date() } },
      { upsert: true }
    );
  };

  const remove = async (id) => {
    await collection.deleteOne({ _id: id });
  };

  const creds = (await read('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(ids.map(async (id) => {
            let value = await read(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          }));
          return data;
        },
        set: async (data) => {
          await Promise.all(
            Object.entries(data).flatMap(([category, items]) =>
              Object.entries(items).map(([id, value]) => {
                const key = `${category}-${id}`;
                return value ? write(value, key) : remove(key);
              })
            )
          );
        }
      }
    },
    saveCreds: () => write(creds, 'creds')
  };
}

module.exports = { useMongoAuthState };
