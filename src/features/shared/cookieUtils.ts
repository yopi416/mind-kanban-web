export const getCookie = (cookieName: string): string | undefined => {
  const cookieArray = document.cookie.split(';')
  for (const raw of cookieArray) {
    const cookie = raw.trim()
    if (cookie.startsWith(`${cookieName}=`)) {
      // 最初の '=' 以降をすべて値として扱う
      // - =が含まれるケースをケアするため、cookieNameの文字数で区切る
      const targetCookieValue = cookie.slice(cookieName.length + 1)
      try {
        // URIエンコードされている場合をケア
        return decodeURIComponent(targetCookieValue)
      } catch {
        return targetCookieValue
      }
    }
  }
  return undefined
}
