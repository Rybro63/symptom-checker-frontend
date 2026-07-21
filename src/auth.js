// Thin wrapper around amazon-cognito-identity-js for signup/login/session.
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js'
import { USER_POOL_ID, USER_POOL_CLIENT_ID } from './config'

const pool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: USER_POOL_CLIENT_ID,
})

export function signUp(email, password) {
  return new Promise((resolve, reject) => {
    pool.signUp(email, password, [], null, (err, result) =>
      err ? reject(err) : resolve(result)
    )
  })
}

export function confirmSignUp(email, code) {
  const user = new CognitoUser({ Username: email, Pool: pool })
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err, result) =>
      err ? reject(err) : resolve(result)
    )
  })
}

export function signIn(email, password) {
  const user = new CognitoUser({ Username: email, Pool: pool })
  const details = new AuthenticationDetails({ Username: email, Password: password })
  return new Promise((resolve, reject) => {
    user.authenticateUser(details, {
      onSuccess: (session) => resolve(session),
      onFailure: reject,
    })
  })
}

export function signOut() {
  const user = pool.getCurrentUser()
  if (user) user.signOut()
}

/** Resolve the current valid session (auto-refreshes if possible), or null. */
export function getSession() {
  return new Promise((resolve) => {
    const user = pool.getCurrentUser()
    if (!user) return resolve(null)
    user.getSession((err, session) => {
      if (err || !session || !session.isValid()) return resolve(null)
      resolve(session)
    })
  })
}

/** The ID token to send as the Authorization header, or null. */
export async function getIdToken() {
  const session = await getSession()
  return session ? session.getIdToken().getJwtToken() : null
}

export function currentUserEmail() {
  const user = pool.getCurrentUser()
  return user ? user.getUsername() : null
}
