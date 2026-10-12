let accessToken: string | null = null;

const setAccessToken = (newAccessToken: string) => {
  accessToken = newAccessToken;
};

const getAccessToken = () => {
  return accessToken;
};

const clearAccessToken = () => {
  accessToken = null;
};

export default {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
};
