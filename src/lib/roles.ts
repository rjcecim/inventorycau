export function canOperateRole(role?: string | null) {
  return role === "ADMIN" || role === "TECH";
}

export function roleLabel(role?: string | null) {
  if (role === "ADMIN") return "Administrador";
  if (role === "TECH") return "Técnico";
  return "Usuário";
}
