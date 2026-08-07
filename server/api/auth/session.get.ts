export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  if (!user) {
    return { loggedIn: false, user: null, needsBootstrap: await needsBootstrap(event) }
  }
  return { loggedIn: true, user, needsBootstrap: false }
})
