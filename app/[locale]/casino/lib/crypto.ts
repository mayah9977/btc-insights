import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.ENCRYPT_SECRET!;

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(SECRET),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(data: {
  iv: string;
  content: string;
  tag: string;
}) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(SECRET),
    Buffer.from(data.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(data.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
