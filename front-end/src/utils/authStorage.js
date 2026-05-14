const TOKEN_KEY = "token";
const USER_KEY = "user";

export const getAuthToken = () =>
  sessionStorage.getItem(TOKEN_KEY);

export const getAuthUser = () => {
  const saved = sessionStorage.getItem(USER_KEY);

  try {
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const saveAuthSession = (token, user) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    const serializedUser = JSON.stringify(user);
    sessionStorage.setItem(USER_KEY, serializedUser);
  }
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
