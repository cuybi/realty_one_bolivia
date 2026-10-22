/**
 * Candado de instancia unica (MongoDB) para el bot de WhatsApp.
 *
 * WhatsApp solo admite UNA sesion multi-dispositivo por numero. Si el bot corre
 * a la vez en la PC y en la nube, una conexion expulsa a la otra con
 * "440 conflict / replaced" y el bot deja de responder (es lo que pasaba).
 *
 * Este lease vive en MongoDB (el mismo que ya guarda la sesion de Baileys):
 * la instancia que lo toma es la unica que conecta a WhatsApp; las demas se
 * quedan en modo espera. Si la instancia activa muere, el lease expira y otra
 * puede tomar el relevo.
 *
 * ponytail: minimo necesario - un documento con expiracion y un heartbeat.
 */

const LEASE_ID = 'bot';
const LEASE_TTL_MS = 90_000; // 3 periodos de heartbeat
const HEARTBEAT_MS = 30_000;

const ownerId = () =>
  process.env.INSTANCE_OWNER || `${require('os').hostname()}-${process.pid}`;

/**
 * Intenta tomar el candado. Devuelve { acquired, owner, expiresAt }.
 * acquired=false significa que hay otra instancia viva: NO se debe conectar.
 */
async function acquireLease(db, owner = ownerId(), ttlMs = LEASE_TTL_MS) {
  const col = db.collection('instance_lease');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    await col.updateOne(
      { _id: LEASE_ID, $or: [{ owner }, { expiresAt: { $lt: now } }] },
      { $set: { owner, expiresAt, updatedAt: now } },
      { upsert: true }
    );
  } catch (err) {
    // 11000 = otro proceso insertó el documento a la vez: el candado es suyo.
    if (err && err.code === 11000) {
      const current = await col.findOne({ _id: LEASE_ID });
      return { acquired: false, owner: current?.owner ?? null, expiresAt: current?.expiresAt ?? null };
    }
    throw err;
  }

  const doc = await col.findOne({ _id: LEASE_ID });
  return {
    acquired: Boolean(doc && doc.owner === owner),
    owner: doc?.owner ?? null,
    expiresAt: doc?.expiresAt ?? null,
  };
}

/** Renueva el candado mientras la instancia viva. Devuelve la funcion de parada. */
function startHeartbeat(db, owner = ownerId(), ttlMs = LEASE_TTL_MS, everyMs = HEARTBEAT_MS) {
  const col = db.collection('instance_lease');
  const timer = setInterval(() => {
    col
      .updateOne(
        { _id: LEASE_ID, owner },
        { $set: { expiresAt: new Date(Date.now() + ttlMs), updatedAt: new Date() } },
      )
      .catch(() => {});
  }, everyMs);
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}

module.exports = { acquireLease, startHeartbeat, ownerId, LEASE_TTL_MS, HEARTBEAT_MS };
