import { all, one, run } from "../db";
import type { Role, User } from "../types";

export function listUsers(): User[] {
  return all<User>(
    `SELECT id, email, name, role, is_active, created_at, last_login_at FROM users
      ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'administrator' THEN 1
                        WHEN 'network_operator' THEN 2 ELSE 3 END, name ASC`,
  );
}

export function getUserById(id: string): User | null {
  return one<User>(
    `SELECT id, email, name, role, is_active, created_at, last_login_at FROM users WHERE id = ?`,
    [id],
  );
}

/**
 * Accepts a full email address, or a bare account name that resolves against
 * the platform's own domain ("admin" → admin@vlinecontrol.au).
 */
export function getUserForAuth(
  identifier: string,
): (User & { password_hash: string }) | null {
  const value = identifier.trim().toLowerCase();
  if (!value) return null;
  const candidates = value.includes("@") ? [value] : [value, `${value}@vlinecontrol.au`];
  for (const candidate of candidates) {
    const row = one<User & { password_hash: string }>(
      `SELECT id, email, name, role, is_active, created_at, last_login_at, password_hash
         FROM users WHERE email = ? COLLATE NOCASE`,
      [candidate],
    );
    if (row) return row;
  }
  return null;
}

export function createUser(values: {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}): void {
  run(
    `INSERT INTO users (id, email, name, password_hash, role, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [values.id, values.email.toLowerCase(), values.name, values.passwordHash, values.role, new Date().toISOString()],
  );
}

export function updateUser(
  id: string,
  values: { name: string; role: Role; isActive: boolean },
): void {
  run(`UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?`, [
    values.name,
    values.role,
    values.isActive ? 1 : 0,
    id,
  ]);
}

export function setPassword(id: string, passwordHash: string): void {
  run(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

export function touchLogin(id: string): void {
  run(`UPDATE users SET last_login_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
}

export function countActiveSuperAdmins(excludeId?: string): number {
  return (
    one<{ count: number }>(
      `SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin' AND is_active = 1
        ${excludeId ? "AND id != ?" : ""}`,
      excludeId ? [excludeId] : [],
    )?.count ?? 0
  );
}
