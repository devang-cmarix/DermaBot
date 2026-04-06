import { useEffect } from "react";

export default function AuthSuccess({ onAuthenticated }) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");

        if (error || !token) {
            window.location.href = "/";
            return;
        }

        fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            localStorage.setItem("medibot_token", token);
            localStorage.setItem("medibot_user", JSON.stringify(data.user));
            onAuthenticated({ token, user: data.user });
            window.history.replaceState({}, "", "/");
        })
        .catch(() => {
            window.location.href = "/";
        });
    }, []);

    return (
        <div style={{
            minHeight: "100vh", display: "grid", placeItems: "center",
            background: "#0d0f14", color: "#e8ecf4", fontFamily: "sans-serif",
        }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Completing Google Sign In...</div>
                <div style={{ color: "#6b7691", marginTop: 8, fontSize: 14 }}>Please wait</div>
            </div>
        </div>
    );
}