/** Converte falhas de rede/API em mensagem adequada para o usuário final. */
export function toUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message
    if (
      msg.includes("Sem conexão com a API") ||
      msg.includes("Failed to fetch") ||
      msg === "Failed to fetch"
    ) {
      return "Não foi possível conectar ao servidor. Verifique sua internet ou se o serviço está disponível."
    }
    if (msg.includes("Unauthorized") || msg.includes("401")) {
      return "Sua sessão expirou. Faça login novamente."
    }
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      return "O recurso solicitado não foi encontrado."
    }
    if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
      return "Esta ação não pôde ser concluída porque os dados já foram alterados."
    }
    if (msg.startsWith("{") && msg.includes("message")) {
      try {
        const j = JSON.parse(msg) as { message?: string | string[] }
        const m = j.message
        if (Array.isArray(m)) return m.join(". ")
        if (typeof m === "string") return m
      } catch {
        /* ignore */
      }
    }
    if (msg.length > 200 && (msg.includes("at ") || msg.includes("TypeError"))) {
      return "Algo inesperado aconteceu. Tente de novo em instantes."
    }
    return msg
  }
  return "Não foi possível completar a operação. Tente novamente."
}
