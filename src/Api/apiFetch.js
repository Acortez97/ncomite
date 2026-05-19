const getToken = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.token ?? null;
  } catch {
    return null;
  }
};

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("user");
    window.location.href = "/login";
    return res;
  }

  return res;
}
