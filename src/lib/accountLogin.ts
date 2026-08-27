import { supabase } from "./supabase";

export type LoginIdentifierType = "email" | "phone" | "wechat";

function normalizeIdentifier(type: LoginIdentifierType, raw: string): string {
  const value = raw.trim();
  if (type === "email") return value.toLowerCase();
  if (type === "wechat") return value.toLowerCase();
  return value.replace(/[\s()-]/g, "");
}

function maskIdentifier(type: LoginIdentifierType, value: string): string {
  if (type === "email") return value;
  if (type === "wechat") return value.length <= 4 ? value : `${value.slice(0, 2)}••${value.slice(-2)}`;
  const digits = value.replace(/\D/g, "");
  return digits.length <= 4 ? `••${digits}` : `•••• ${digits.slice(-4)}`;
}

async function aliasEmail(type: Exclude<LoginIdentifierType, "email">, raw: string): Promise<string> {
  const normalized = normalizeIdentifier(type, raw);
  if (!normalized) throw new Error(type === "phone" ? "请输入手机号。" : "请输入微信号。");
  const bytes = new TextEncoder().encode(`skincare101:${type}:${normalized}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${type}.${hash.slice(0, 48)}@login.skincare101.app`;
}

async function authEmail(type: LoginIdentifierType, identifier: string): Promise<string> {
  const normalized = normalizeIdentifier(type, identifier);
  if (!normalized) throw new Error("请输入登录账号。");
  if (type === "email") return normalized;
  return aliasEmail(type, normalized);
}

export async function signInWithIdentifier(type: LoginIdentifierType, identifier: string, password: string): Promise<void> {
  const email = await authEmail(type, identifier);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithIdentifier(type: LoginIdentifierType, identifier: string, password: string): Promise<void> {
  const normalized = normalizeIdentifier(type, identifier);
  const email = await authEmail(type, normalized);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        login_identifier_type: type,
        login_identifier_hint: maskIdentifier(type, normalized),
      },
    },
  });
  if (error) throw error;
  if (!data.session) throw new Error("账号已创建，但当前 Supabase 仍要求邮件确认。请关闭 Confirm email 后再使用无验证码账号。");
}

export function getSignedInIdentifierLabel(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined): string {
  if (!user) return "";
  const type = user.user_metadata?.login_identifier_type as LoginIdentifierType | undefined;
  const hint = user.user_metadata?.login_identifier_hint as string | undefined;
  if (type === "phone") return hint ? `手机号 · ${hint}` : "手机号账号";
  if (type === "wechat") return hint ? `微信号 · ${hint}` : "微信号账号";
  return user.email || "邮箱账号";
}
