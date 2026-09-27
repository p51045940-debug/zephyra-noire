const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ["ZEPHYRA NOIRE", "Chrome", "1.0"]
  })

  if (!sock.authState.creds.registered) {
    const phone = "2348088457825"
    console.log("REQUESTING PAIRING CODE FOR:", phone)
    setTimeout(async () => {
      let code = await sock.requestPairingCode(phone)
      console.log("YOUR PAIRING CODE IS:", code)
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u
    if (connection === 'open') console.log("ZEPHYRA NOIRE CONNECTED SUCCESSFULLY")
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) start()
    }
  })

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0]
    if (!msg.message || msg.key.fromMe) return
    const from = msg.key.remoteJid
    await sock.sendMessage(from, { react: { text: "🔥", key: msg.key } })
  })

  sock.ev.on('group-participants.update', async (anu) => {
    if (anu.action === 'add') {
      const jid = anu.participants[0]
      await sock.sendMessage(anu.id, { text: `Welcome @${jid.split('@')[0]} 🖤`, mentions: [jid] })
    }
  })
}
start()
