import tls from "tls"
import net from "net"
import fs from "fs"
import path from "path"

function loadEnvTxt() {
  try {
    const paths = [
      path.join(process.cwd(), "env.txt"),
      path.join(process.cwd(), ".env.txt"),
    ]
    const envPath = paths.find((p) => fs.existsSync(p))
    if (envPath) {
      const content = fs.readFileSync(envPath, "utf8")
      for (const line of content.split(/\r?\n/)) {
        const t = line.trim()
        if (!t || t.startsWith("#")) continue
        const i = t.indexOf("=")
        if (i > 0) {
          const k = t.slice(0, i).trim()
          const v = t.slice(i + 1).trim()
          if (k && !(k in process.env)) process.env[k] = v
        }
      }
    }
  } catch {}
}

loadEnvTxt()

async function sendViaSmtp(to: string, code: string) {
  const host = process.env.SMTP_HOST || ""
  const port = parseInt(process.env.SMTP_PORT || "465", 10)
  const user = process.env.SMTP_USER || ""
  const pass = process.env.SMTP_PASS || ""
  const from = process.env.SMTP_FROM || user
  if (!host || !user || !pass || !from) return false
  try {
    const socket = tls.connect({ host, port, servername: host })
    const write = (s: string) => { socket.write(s + "\r\n") }
    const read = () => new Promise<string>((r) => { socket.once("data", (d) => r(d.toString("utf8"))) })
    await read()
    write(`EHLO ${host}`); await read()
    write("AUTH LOGIN"); await read()
    write(Buffer.from(user).toString("base64")); await read()
    write(Buffer.from(pass).toString("base64")); await read()
    write(`MAIL FROM:<${from}>`); await read()
    write(`RCPT TO:<${to}>`); await read()
    write("DATA"); await read()
    const msg = [
      `From: BetScribe <${from}>`,
      `To: <${to}>`,
      `Subject: Código de verificación`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      `Tu código de verificación es: ${code}`,
      `Este código expira en 10 minutos.`
    ].join("\r\n")
    write(msg)
    write("."); await read()
    write("QUIT"); socket.end()
    return true
  } catch {
    return false
  }
}

async function sendViaResend(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY || ""
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || ""
  if (!apiKey || !from) return false
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Código de verificación",
        text: `Tu código de verificación es: ${code}\n\nEste código expira en 10 minutos.`,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  if (await sendViaSmtp(to, code)) return true
  async function sendViaStartTls(toAddr: string, codeStr: string) {
    const host = process.env.SMTP_HOST || ""
    const user = process.env.SMTP_USER || ""
    const pass = process.env.SMTP_PASS || ""
    const from = process.env.SMTP_FROM || user
    const port = parseInt(process.env.SMTP_PORT || "587", 10)
    if (!host || !user || !pass || !from) return false
    try {
      const socket = net.connect({ host, port })
      const write = (s: string) => { socket.write(s + "\r\n") }
      const read = () => new Promise<string>((r) => { socket.once("data", (d) => r(d.toString("utf8"))) })
      await read()
      write(`EHLO ${host}`); await read()
      write("STARTTLS"); await read()
      const tlsSocket = tls.connect({ socket, servername: host })
      const twrite = (s: string) => { tlsSocket.write(s + "\r\n") }
      const tread = () => new Promise<string>((r) => { tlsSocket.once("data", (d) => r(d.toString("utf8"))) })
      twrite(`EHLO ${host}`); await tread()
      twrite("AUTH LOGIN"); await tread()
      twrite(Buffer.from(user).toString("base64")); await tread()
      twrite(Buffer.from(pass).toString("base64")); await tread()
      twrite(`MAIL FROM:<${from}>`); await tread()
      twrite(`RCPT TO:<${toAddr}>`); await tread()
      twrite("DATA"); await tread()
      const msg = [
        `From: BetScribe <${from}>`,
        `To: <${toAddr}>`,
        `Subject: Código de verificación`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        "",
        `Tu código de verificación es: ${codeStr}`,
        `Este código expira en 10 minutos.`
      ].join("\r\n")
      twrite(msg)
      twrite("."); await tread()
      twrite("QUIT"); tlsSocket.end()
      return true
    } catch {
      return false
    }
  }
  if (await sendViaStartTls(to, code)) return true
  if (await sendViaResend(to, code)) return true
  return false
}
