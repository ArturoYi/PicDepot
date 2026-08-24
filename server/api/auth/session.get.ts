export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const user = await getSessionUser(event)
  if (!user) {
    return { loggedIn: false, user: null, needsBootstrap: await needsBootstrap(event) }
  }
  return { loggedIn: true, user, needsBootstrap: false }
})
