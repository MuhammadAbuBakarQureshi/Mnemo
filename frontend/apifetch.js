export default async function apiFetch(path, method, headers, body) {

    const finalHeaders = { "Content-Type": "application/json", ...(headers || {}) };

    const response = await fetch(path, {
        method: method,
        headers: finalHeaders,
        body: (body ? body : null),
        credentials: "include",
    });

    if (response.status === 401) {
        window.location.href = "/login";
        return;
    }

    return response;
}