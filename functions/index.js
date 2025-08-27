import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import fetch from 'node-fetch';
admin.initializeApp();

const BAD = ['nigger','faggot','retard','kike','chink','spic','cunt','fuck','shit','bitch','asshole'];

function hasBad(text){ const t=(text||'').toLowerCase(); return BAD.some(w => t.indexOf(w)!==-1); }
function filterText(text){ let out=text||''; BAD.forEach(w=>{ out=out.replace(new RegExp(w,'gi'),'***'); }); return out; }

export const guardMessages = functions.firestore
  .document('rooms/{roomId}/messages/{msgId}')
  .onCreate(async (snap, ctx) => {
    const roomId = ctx.params.roomId;
    const msg = snap.data() || {};
    const meta = await admin.firestore().doc(`rooms/${roomId}/_meta/config`).get();
    const cfg = meta.exists ? meta.data() : {};
    const profanity = (cfg && typeof cfg.profanity==='boolean') ? cfg.profanity : true;

    const updates = {};
    if(!msg.tsMs) updates.tsMs = Date.now();

    if (profanity && msg.text && hasBad(msg.text)) {
      updates.text = filterText(msg.text);
      updates.flagged = true;
    }

    if (msg.uid) {
      const since = Date.now() - 30000;
      const q = await admin.firestore().collection(`rooms/${roomId}/messages`).where('uid','==',msg.uid).where('tsMs','>=',since).get();
      if (q.size >= 5) {
        await admin.firestore().doc(`rooms/${roomId}/bans/${msg.uid}`).set({ until: Date.now()+10*60*1000, reason: 'rate' }, { merge: true });
        updates.text = '[removed: rate limited]'; updates.flagged = true;
      }
    }
    if(Object.keys(updates).length) await snap.ref.update(updates);

    await admin.firestore().collection('rooms_index').doc(roomId).set({ roomId, lastActivity: Date.now() }, { merge: true });

    if (cfg.shareToDiscord && cfg.discordWebhookUrl) {
      const clean = filterText(msg.text || '');
      const content = `**${msg.user||'Anon'}:** ${clean}`;
      try {
        await fetch(cfg.discordWebhookUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content }) });
      } catch(e){ console.error('Discord post failed', e); }
    }
    return null;
  });

export const syncMemberCounts = functions.firestore
  .document('rooms/{roomId}/members/{uid}')
  .onWrite(async (chg, ctx) => {
    const roomId = ctx.params.roomId;
  import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import fetch from 'node-fetch';
admin.initializeApp();

const BAD = ['nigger','faggot','retard','kike','chink','spic','cunt','fuck','shit','bitch','asshole'];

function hasBad(text){ const t=(text||'').toLowerCase(); return BAD.some(w => t.indexOf(w)!==-1); }
function filterText(text){ let out=text||''; BAD.forEach(w=>{ out=out.replace(new RegExp(w,'gi'),'***'); }); return out; }

export const guardMessages = functions.firestore
  .document('rooms/{roomId}/messages/{msgId}')
  .onCreate(async (snap, ctx) => {
    const roomId = ctx.params.roomId;
    const msg = snap.data() || {};
    const meta = await admin.firestore().doc(`rooms/${roomId}/_meta/config`).get();
    const cfg = meta.exists ? meta.data() : {};
    const profanity = (cfg && typeof cfg.profanity==='boolean') ? cfg.profanity : true;

    const updates = {};
    if(!msg.tsMs) updates.tsMs = Date.now();

    if (profanity && msg.text && hasBad(msg.text)) {
      updates.text = filterText(msg.text);
      updates.flagged = true;
    }

    if (msg.uid) {
      const since = Date.now() - 30000;
      const q = await admin.firestore().collection(`rooms/${roomId}/messages`).where('uid','==',msg.uid).where('tsMs','>=',since).get();
      if (q.size >= 5) {
        await admin.firestore().doc(`rooms/${roomId}/bans/${msg.uid}`).set({ until: Date.now()+10*60*1000, reason: 'rate' }, { merge: true });
        updates.text = '[removed: rate limited]'; updates.flagged = true;
      }
    }
    if(Object.keys(updates).length) await snap.ref.update(updates);

    await admin.firestore().collection('rooms_index').doc(roomId).set({ roomId, lastActivity: Date.now() }, { merge: true });

    if (cfg.shareToDiscord && cfg.discordWebhookUrl) {
      const clean = filterText(msg.text || '');
      const content = `**${msg.user||'Anon'}:** ${clean}`;
      try {
        await fetch(cfg.discordWebhookUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content }) });
      } catch(e){ console.error('Discord post failed', e); }
    }
    return null;
  });

export const syncMemberCounts = functions.firestore
  .document('rooms/{roomId}/members/{uid}')
  .onWrite(async (chg, ctx) => {
    const roomId = ctx.params.roomId;
    const snap = await admin.firestore().collection(`rooms/${roomId}/members`).get();
    await admin.firestore().collection('rooms_index').doc(roomId).set({ roomId, memberCount: snap.size, lastActivity: Date.now() }, { merge: true });
    return null;
  });

export const runCommands = functions.firestore
  .document('rooms/{roomId}/commands/{cmdId}')
  .onCreate(async (snap, ctx) => {
    const { roomId } = ctx.params; const cmd = snap.data() || {};
    const uid = cmd.uid || null;
    if (!uid) return null;
    const m = await admin.firestore().doc(`rooms/${roomId}/members/${uid}`).get();
    const role = m.exists ? (m.data().role || 'member') : 'guest';
    if (role !== 'owner') return null;

    const db = admin.firestore();
    if (cmd.type === 'purge') {
      const msgs = await db.collection(`rooms/${roomId}/messages`).get();
      const batch = db.batch(); msgs.forEach(d => batch.delete(d.ref)); await batch.commit();
    } else if (cmd.type === 'deleteRoom') {
      const subs = ['messages','members','calendar','challenges','bans','commands','_meta'];
      for (const s of subs) {
        const col = await db.collection(`rooms/${roomId}/${s}`).get();
        const batch = db.batch(); col.forEach(d => batch.delete(d.ref)); await batch.commit();
      }
      await db.collection('rooms_index').doc(roomId).delete().catch(()=>{});
    }
    return null;
  });  const snap = await admin.firestore().collection(`rooms/${roomId}/members`).get();
    await admin.firestore().collection('rooms_index').doc(roomId).set({ roomId, memberCount: snap.size, lastActivity: Date.now() }, { merge: true });
    return null;
  });

export const runCommands = functions.firestore
  .document('rooms/{roomId}/commands/{cmdId}')
  .onCreate(async (snap, ctx) => {
    const { roomId } = ctx.params; const cmd = snap.data() || {};
    const uid = cmd.uid || null;
    if (!uid) return null;
    const m = await admin.firestore().doc(`rooms/${roomId}/members/${uid}`).get();
    const role = m.exists ? (m.data().role || 'member') : 'guest';
    if (role !== 'owner') return null;

    const db = admin.firestore();
    if (cmd.type === 'purge') {
      const msgs = await db.collection(`rooms/${roomId}/messages`).get();
      const batch = db.batch(); msgs.forEach(d => batch.delete(d.ref)); await batch.commit();
    } else if (cmd.type === 'deleteRoom') {
      const subs = ['messages','members','calendar','challenges','bans','commands','_meta'];
      for (const s of subs) {
        const col = await db.collection(`rooms/${roomId}/${s}`).get();
        const batch = db.batch(); col.forEach(d => batch.delete(d.ref)); await batch.commit();
      }
      await db.collection('rooms_index').doc(roomId).delete().catch(()=>{});
    }
    return null;
  });
